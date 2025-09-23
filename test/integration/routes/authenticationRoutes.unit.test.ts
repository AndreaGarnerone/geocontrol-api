import request from "supertest";
import express from "express";
import authenticationRoutes from "@routes/authenticationRoutes";
import * as authController from "@controllers/authController";
import * as UserDTO from "@dto/User";

// Mock delle dipendenze
jest.mock("@controllers/authController");
jest.mock("@dto/User");

const mockedGetToken = authController.getToken as jest.MockedFunction<typeof authController.getToken>;
const mockedUserFromJSON = UserDTO.UserFromJSON as jest.MockedFunction<typeof UserDTO.UserFromJSON>;

describe("Authentication Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/auth", authenticationRoutes);
    
    // Error handler middleware per catturare gli errori
    app.use((error: any, req: any, res: any, next: any) => {
      if (error.message === "Invalid user data") {
        return res.status(400).json({ error: "Invalid user data" });
      }
      if (error.message === "Authentication failed") {
        return res.status(401).json({ error: "Authentication failed" });
      }
      res.status(500).json({ error: "Internal server error" });
    });

    jest.clearAllMocks();
  });

  it("should call next with error when UserFromJSON throws", async () => {
    // Arrange
    mockedUserFromJSON.mockImplementation(() => {
      throw new Error("Invalid user data");
    });

    // Act
    const response = await request(app)
      .post("/auth")
      .send({ username: "test", password: "test" });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid user data" });
    expect(mockedUserFromJSON).toHaveBeenCalledWith({ username: "test", password: "test" });
    expect(mockedGetToken).not.toHaveBeenCalled();
  });

  it("should call next with error when getToken throws", async () => {
    // Arrange
    const mockUser = { username: "test", password: "test" };
    mockedUserFromJSON.mockReturnValue(mockUser);
    mockedGetToken.mockImplementation(() => {
      throw new Error("Authentication failed");
    });

    // Act
    const response = await request(app)
      .post("/auth")
      .send({ username: "test", password: "test" });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Authentication failed" });
    expect(mockedUserFromJSON).toHaveBeenCalledWith({ username: "test", password: "test" });
    expect(mockedGetToken).toHaveBeenCalledWith(mockUser);
  });

  it("should return token when authentication succeeds", async () => {
    // Arrange
    const mockUser = { username: "test", password: "test" };
    const mockToken = { token: "jwt-token", user: mockUser };
    mockedUserFromJSON.mockReturnValue(mockUser);
    mockedGetToken.mockResolvedValue(mockToken);

    // Act
    const response = await request(app)
      .post("/auth")
      .send({ username: "test", password: "test" });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockToken);
    expect(mockedUserFromJSON).toHaveBeenCalledWith({ username: "test", password: "test" });
    expect(mockedGetToken).toHaveBeenCalledWith(mockUser);
  });

  it("should handle unexpected errors", async () => {
    // Arrange
    const mockUser = { username: "test", password: "test" };
    mockedUserFromJSON.mockReturnValue(mockUser);
    mockedGetToken.mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    // Act
    const response = await request(app)
      .post("/auth")
      .send({ username: "test", password: "test" });

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal server error" });
  });
});
