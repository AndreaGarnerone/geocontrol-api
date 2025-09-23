import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as userController from "@controllers/userController";
import { UserType } from "@models/UserType";
import { User as UserDTO } from "@dto/User";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";

jest.mock("@services/authService");
jest.mock("@controllers/userController");

describe("UserRoutes integration", () => {
  const token = "Bearer faketoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("get all users", async () => {
    const mockUsers: UserDTO[] = [
      { username: "admin", type: UserType.Admin },
      { username: "viewer", type: UserType.Viewer }
    ];

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

    const response = await request(app)
      .get("/api/v1/users")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUsers);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin
    ]);
    expect(userController.getAllUsers).toHaveBeenCalled();
  });

  it("get all users: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("get all users: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .get("/api/v1/users")
      .set("Authorization", token);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

  it("Get all users: 500 Internal server error", async() =>{
    (authService.processToken as jest.Mock).mockResolvedValue({
            username: "admin",
            type: UserType.Admin
            });
            const route = `/api/v1/users`;
            (userController.getAllUsers as jest.Mock).mockImplementation(() => {
                throw new Error("Something went wrong");
            });
    
            
                const response = await request(app)
                .get(route)
                .set("Authorization", token)

                expect(response.status).toBe(500);
                expect(response.body.message).toMatch(/Something went wrong/);
  })

  it("Create user (Admin only): (201 OK)", async () =>{
    const route = "/api/v1/users";
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.createUser as jest.Mock).mockResolvedValue({
      username : "s0123465",
      password: "FR90!5g@+ni",
      type: "admin"
    });

    const response = await request(app)
    .post(route)
    .set("Authorization", token)
    .send({username : "s0123465",
          password: "FR90!5g@+ni",
          type: "admin"})

    expect(response.status).toBe(201);
    expect(userController.createUser).toHaveBeenCalledWith({
      username : "s0123465",
      password: "FR90!5g@+ni",
      type: "admin"
    });

    expect(authService.processToken).toHaveBeenCalledWith(token, [
            UserType.Admin,
          ]);
  });

  it("Create user (Admin only): 401 UnauthorizedError", async () =>{
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .post("/api/v1/users")
      .set("Authorization", "Bearer invalid")
      .send({username : "s0123465",
          password: "FR90!5g@+ni",
          type: "admin"})

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("Create user (Admin only): 403 InsufficientRightsError",async () =>{
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .post("/api/v1/users")
      .set("Authorization", token)
      .send({username : "s0123465",
          password: "FR90!5g@+ni",
          type: "admin"})


    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

  it("Create user (Admin only): (500 Internal error)", async() =>{
    (authService.processToken as jest.Mock).mockResolvedValue({
      username: "admin",
      type: UserType.Admin
      });
    const route = `/api/v1/users`;
    (userController.createUser as jest.Mock).mockImplementation(() => {
        throw new Error("Something went wrong");
    });

    const response = await request(app)
    .post(route)
    .set("Authorization", token)
    .send({username : "s0123465",
      password: "FR90!5g@+ni",
      type: "admin"})

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Something went wrong/);
  })

  it("Get user by username: (200 OK)", async() =>{
    const mockUser : UserDTO = { username: "admin", type: UserType.Admin};

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.getUser as jest.Mock).mockResolvedValue(mockUser);

    const response = await request(app)
      .get("/api/v1/users/admin")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUser);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin
    ]);
    expect(userController.getUser).toHaveBeenCalled();
  });

  it("Get user by username: (401 UnauthorizedError)", async() =>{
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .get("/api/v1/users/admin")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("Get user by username: (403 Insufficient Rights)", async() =>{
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .get("/api/v1/users/admin")
      .set("Authorization", token);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

  it("Get user by username: (404 Not Found Error)", async () =>{
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
            (userController.getUser as jest.Mock).mockImplementation(() => {
                throw new NotFoundError("User not found");
            });
    
            const response = await request(app)
            .get("/api/v1/users/admin")
            .set("Authorization", token)
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("User not found");
  });

  it("Get user by username: (500 Internal server error)", async() => {
    (authService.processToken as jest.Mock).mockResolvedValue({
            username: "admin",
            type: UserType.Admin
            });
            const route = `/api/v1/users/admin`;
            (userController.getUser as jest.Mock).mockImplementation(() => {
                throw new Error("Something went wrong");
            });
    
            
                const response = await request(app)
                .get(route)
                .set("Authorization", token)

                expect(response.status).toBe(500);
                expect(response.body.message).toMatch(/Something went wrong/);
  });

  it("Delete user: (204 User deleted)", async() =>{
    const route = "/api/v1/users/s0123465";
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.deleteUser as jest.Mock).mockResolvedValue({
      username : "s0123465",
    });

    const response = await request(app)
    .delete(route)
    .set("Authorization", token)

    expect(response.status).toBe(204);
    expect(userController.deleteUser).toHaveBeenCalledWith("s0123465");

    expect(authService.processToken).toHaveBeenCalledWith(token, [
            UserType.Admin,
          ]);
  });

  it("Delete user: (401 Unauthorized error)", async () =>{
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .delete("/api/v1/users/admin")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("Delete user: (403 Insufficient Rights)", async () =>{
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .delete("/api/v1/users/admin")
      .set("Authorization", token);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

  it("Delete user: (404 Not Found Error)", async () =>{
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
            (userController.deleteUser as jest.Mock).mockImplementation(() => {
                throw new NotFoundError("User not found");
            });
    
            const response = await request(app)
            .delete("/api/v1/users/admin")
            .set("Authorization", token)
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("User not found");
  });

  it("Delete user: (500 Internal server errror)", async () =>{
    (authService.processToken as jest.Mock).mockResolvedValue({
            username: "admin",
            type: UserType.Admin
            });
            const route = `/api/v1/users/admin`;
            (userController.deleteUser as jest.Mock).mockImplementation(() => {
                throw new Error("Something went wrong");
            });
    
            
                const response = await request(app)
                .delete(route)
                .set("Authorization", token)

                expect(response.status).toBe(500);
                expect(response.body.message).toMatch(/Something went wrong/);
  });
    

});
