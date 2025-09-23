import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import {
  beforeAllE2eMeasuerements,
  afterAllE2e,
  TEST_USERS,
} from "@test/e2e/lifecycle";

describe("POST measurements", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2eMeasuerements();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("should create a new group of measurements", async () => {
    const response = await request(app)
      .post(
        "/api/v1/networks/Net01/gateways/Gate01/sensors/Sens01/measurements"
      )
      .set("Authorization", `Bearer ${token}`)
      .send([
        { value: 25.5, createdAt: "2025-02-18T17:00:00+01:00" },
        { value: 26.0, createdAt: "2025-02-18T17:30:00+01:00" },
      ]);

    expect(response.status).toBe(201);
  });

  it("should return 400 for invalid measurements", async () => {
    const response = await request(app)
      .post(
        "/api/v1/networks/Net01/gateways/Gate01/sensors/Sens01/measurements"
      )
      .set("Authorization", `Bearer ${token}`)
      .send([
        { value: "invalid", createdAt: "2025-02-18T17:00:00+01:00" },
        { value: 26.0, createdAt: "2025-02-18T17:30:00+01:00" },
      ]);

    expect(response.status).toBe(400);
  });

  it("should return 401 fot unauthorized access (invalid Token)", async () => {
    const response = await request(app)
      .post(
        "/api/v1/networks/Net01/gateways/Gate01/sensors/Sens01/measurements"
      )
      .set("Authorization", token + "1")
      .send([{ value: 26.0, createdAt: "2025-02-18T17:30:00+01:00" }]);

    expect(response.status).toBe(401);
  });

  it("should return 403 for insufficient right ", async () => {
    const tokenViewer = generateToken(TEST_USERS.viewer);
    const response = await request(app)
      .post(
        "/api/v1/networks/Net01/gateways/Gate01/sensors/Sens01/measurements"
      )
      .set("Authorization", `Bearer ${tokenViewer}`)
      .send([{ value: 26.0, createdAt: "2025-02-18T17:30:00+01:00" }]);

    expect(response.status).toBe(403);
  });

  it("should return 404 for non-existing sensor", async () => {
    const response = await request(app)
      .post(
        "/api/v1/networks/Net01/gateways/Gate01/sensors/Sens99/measurements"
      )
      .set("Authorization", `Bearer ${token}`)
      .send([{ value: 26.0, createdAt: "2025-02-18T17:30:00+01:00" }]);

    expect(response.status).toBe(404);
  });

  it("should return 404 for non-existing network", async () => {
    const response = await request(app)
      .post(
        "/api/v1/networks/Net04/gateways/Gate01/sensors/Sens01/measurements"
      )
      .set("Authorization", `Bearer ${token}`)
      .send([{ value: 26.0, createdAt: "2025-02-18T17:30:00+01:00" }]);

    expect(response.status).toBe(404);
  });

  it("should return 404 for non-existing gateway", async () => {
    const response = await request(app)
      .post(
        "/api/v1/networks/Net01/gateways/Gate09/sensors/Sens01/measurements"
      )
      .set("Authorization", `Bearer ${token}`)
      .send([{ value: 26.0, createdAt: "2025-02-18T17:30:00+01:00" }]);

    expect(response.status).toBe(404);
  });
});

describe("GET measurements by Network", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2eMeasuerements();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("should get measurements for a specific network", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/measurements")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        sensorMacAddress: "Sens03",
        stats: {
          startDate: "2025-01-18T15:00:00.000Z",
          endDate: "2025-01-18T23:10:00.000Z",
          mean: 13.811111111111112,
          variance: 206.1632098765432,
          upperThreshold: 42.527880419412014,
          lowerThreshold: -14.905658197189792,
        },
        measurements: [
          {
            createdAt: "2025-01-18T15:00:00.000Z",
            value: 6.1,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:10:00.000Z",
            value: 25.2,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:20:00.000Z",
            value: 4.3,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:30:00.000Z",
            value: 50.5,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:40:00.000Z",
            value: 4.7,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:50:00.000Z",
            value: 4.9,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T22:50:00.000Z",
            value: 10.5,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T23:00:00.000Z",
            value: 6.7,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T23:10:00.000Z",
            value: 11.4,
            isOutlier: false,
          },
        ],
      },
      {
        sensorMacAddress: "Sens02",
        stats: {
          startDate: "2025-01-18T15:00:00.000Z",
          endDate: "2025-01-18T23:10:00.000Z",
          mean: 13.377777777777776,
          variance: 159.75950617283945,
          upperThreshold: 38.65697920288925,
          lowerThreshold: -11.901423647333694,
        },
        measurements: [
          {
            createdAt: "2025-01-18T15:00:00.000Z",
            value: 8.3,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:10:00.000Z",
            value: 22.7,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:20:00.000Z",
            value: 3.9,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:30:00.000Z",
            value: 45.8,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:40:00.000Z",
            value: 5.2,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:50:00.000Z",
            value: 5.4,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T22:50:00.000Z",
            value: 9.8,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T23:00:00.000Z",
            value: 7.1,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T23:10:00.000Z",
            value: 12.2,
            isOutlier: false,
          },
        ],
      },
    ]);
  });

  it("should get measurements for a specific network with stard-date and end-date", async () => {
    const response = await request(app)
      .get(
        "/api/v1/networks/Net02/measurements?startDate=2025-01-18T15%3A00%3A00%2B01%3A00&endDate=2025-01-18T16%3A20%3A00%2B01%3A00"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        sensorMacAddress: "Sens03",
        stats: {
          startDate: "2025-01-18T14:00:00.000Z",
          endDate: "2025-01-18T15:20:00.000Z",
          mean: 11.866666666666665,
          variance: 89.42888888888888,
          upperThreshold: 30.78003642341693,
          lowerThreshold: -7.046703090083598,
        },
        measurements: [
          {
            createdAt: "2025-01-18T15:00:00.000Z",
            value: 6.1,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:10:00.000Z",
            value: 25.2,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:20:00.000Z",
            value: 4.3,
            isOutlier: false,
          },
        ],
      },
      {
        sensorMacAddress: "Sens02",
        stats: {
          startDate: "2025-01-18T14:00:00.000Z",
          endDate: "2025-01-18T15:20:00.000Z",
          mean: 11.633333333333333,
          variance: 64.46222222222222,
          upperThreshold: 27.691007165146235,
          lowerThreshold: -4.42434049847957,
        },
        measurements: [
          {
            createdAt: "2025-01-18T15:00:00.000Z",
            value: 8.3,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:10:00.000Z",
            value: 22.7,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:20:00.000Z",
            value: 3.9,
            isOutlier: false,
          },
        ],
      },
    ]);
  });

  it("should get measurements for a specific network with start-date and end-date and for a specific set of sensor", async () => {
    const response = await request(app)
      .get(
        "/api/v1/networks/Net02/measurements?sensorMacs=Sens02&startDate=2025-01-18T15%3A00%3A00%2B01%3A00&endDate=2025-01-18T16%3A20%3A00%2B01%3A00"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        sensorMacAddress: "Sens02",
        stats: {
          mean: 11.633333333333333,
          variance: 64.46222222222222,
          upperThreshold: 27.691007165146235,
          lowerThreshold: -4.42434049847957,
          startDate: "2025-01-18T14:00:00.000Z",
          endDate: "2025-01-18T15:20:00.000Z",
        },
        measurements: [
          {
            createdAt: "2025-01-18T15:00:00.000Z",
            value: 8.3,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:10:00.000Z",
            value: 22.7,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:20:00.000Z",
            value: 3.9,
            isOutlier: false,
          },
        ],
      },
    ]);
  });

  it("should get measurements for a specific network and for a specific set of sensors", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/measurements?sensorMacs=Sens02")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        sensorMacAddress: "Sens02",
        stats: {
          mean: 13.377777777777776,
          variance: 159.75950617283945,
          upperThreshold: 38.65697920288925,
          lowerThreshold: -11.901423647333694,
          startDate: "2025-01-18T15:00:00.000Z",
          endDate: "2025-01-18T23:10:00.000Z",
        },
        measurements: [
          {
            createdAt: "2025-01-18T15:00:00.000Z",
            value: 8.3,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:10:00.000Z",
            value: 22.7,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:20:00.000Z",
            value: 3.9,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:30:00.000Z",
            value: 45.8,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:40:00.000Z",
            value: 5.2,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T15:50:00.000Z",
            value: 5.4,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T22:50:00.000Z",
            value: 9.8,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T23:00:00.000Z",
            value: 7.1,
            isOutlier: false,
          },
          {
            createdAt: "2025-01-18T23:10:00.000Z",
            value: 12.2,
            isOutlier: false,
          },
        ],
      },
    ]);
  });

  it("should get error 400 for a invalid data", async () => {
    const response = await request(app)
      .get(
        "/api/v1/networks/Net02/measurements?startDate=2025-01-18T15:00:00+01:00&endDate=2025-01-18T16:20:00+01:00"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it("should return 401 fot unauthorized access (invalid Token)", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/measurements")
      .set("Authorization", token + "1");

    expect(response.status).toBe(401);
  });

  it("should return 404 for Network not found", async () => {
    const tokenViewer = generateToken(TEST_USERS.viewer);
    const response = await request(app)
      .get("/api/v1/networks/Net04/measurements")
      .set("Authorization", `Bearer ${tokenViewer}`);

    expect(response.status).toBe(404);
  });
});

describe("GET stats by Network", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2eMeasuerements();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("should get stats for a specific network", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        sensorMacAddress: "Sens03",
        stats: {
          mean: 13.811111111111112,
          variance: 206.1632098765432,
          upperThreshold: 42.527880419412014,
          lowerThreshold: -14.905658197189792,
          startDate: "2025-01-18T15:00:00.000Z",
          endDate: "2025-01-18T23:10:00.000Z",
        },
      },
      {
        sensorMacAddress: "Sens02",
        stats: {
          mean: 13.377777777777776,
          variance: 159.75950617283945,
          upperThreshold: 38.65697920288925,
          lowerThreshold: -11.901423647333694,
          startDate: "2025-01-18T15:00:00.000Z",
          endDate: "2025-01-18T23:10:00.000Z",
        },
      },
    ]);
  });

  it("should get stats for a specific network with start-date and end-date", async () => {
    const response = await request(app)
      .get(
        "/api/v1/networks/Net02/stats?startDate=2025-01-18T15%3A00%3A00%2B01%3A00&endDate=2025-01-18T16%3A20%3A00%2B01%3A00"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        sensorMacAddress: "Sens03",
        stats: {
          mean: 11.866666666666665,
          variance: 89.42888888888888,
          upperThreshold: 30.78003642341693,
          lowerThreshold: -7.046703090083598,
          startDate: "2025-01-18T14:00:00.000Z",
          endDate: "2025-01-18T15:20:00.000Z",
        },
      },
      {
        sensorMacAddress: "Sens02",
        stats: {
          mean: 11.633333333333333,
          variance: 64.46222222222222,
          upperThreshold: 27.691007165146235,
          lowerThreshold: -4.42434049847957,
          startDate: "2025-01-18T14:00:00.000Z",
          endDate: "2025-01-18T15:20:00.000Z",
        },
      },
    ]);
  });

  it("should get stats for a specific network with start-date and end-date and for a specific set of sensor", async () => {
    const response = await request(app)
      .get(
        "/api/v1/networks/Net02/stats?sensorMacs=Sens02&startDate=2025-01-18T15%3A00%3A00%2B01%3A00&endDate=2025-01-18T16%3A20%3A00%2B01%3A00"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        sensorMacAddress: "Sens02",
        stats: {
          mean: 11.633333333333333,
          variance: 64.46222222222222,
          upperThreshold: 27.691007165146235,
          lowerThreshold: -4.42434049847957,
          startDate: "2025-01-18T14:00:00.000Z",
          endDate: "2025-01-18T15:20:00.000Z",
        },
      },
    ]);
  });

  it("should get stats for a specific network and for a specific set of sensors", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/stats?sensorMacs=Sens02")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        sensorMacAddress: "Sens02",
        stats: {
          mean: 13.377777777777776,
          variance: 159.75950617283945,
          upperThreshold: 38.65697920288925,
          lowerThreshold: -11.901423647333694,
          startDate: "2025-01-18T15:00:00.000Z",
          endDate: "2025-01-18T23:10:00.000Z",
        },
      },
    ]);
  });

  it("should return 400 for invalid data", async () => {
    const response = await request(app)
      .get(
        "/api/v1/networks/Net02/stats?startDate=2025-01-18T15:00:00+01:00&endDate=2025-01-18T16:20:00+01:00"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it("should return 401 fot unauthorized access (invalid Token)", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/stats")
      .set("Authorization", token + "1");

    expect(response.status).toBe(401);
  });

  it("should return 404 for Network not found", async () => {
    const tokenViewer = generateToken(TEST_USERS.viewer);
    const response = await request(app)
      .get("/api/v1/networks/Net04/stats")
      .set("Authorization", `Bearer ${tokenViewer}`);

    expect(response.status).toBe(404);
  });

  //Aggiungere il caso in cui ci sono degli elementi nel vettore sensorsMacAddress
});

describe("GET outlier measurements by Network", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2eMeasuerements();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("should get outlier measurements for a specific network", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/outliers")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        sensorMacAddress: "Sens03",
        stats: {
          mean: 13.811111111111112,
          variance: 206.1632098765432,
          upperThreshold: 42.527880419412014,
          lowerThreshold: -14.905658197189792,
          startDate: "2025-01-18T15:00:00.000Z",
          endDate: "2025-01-18T23:10:00.000Z",
        },
        measurements: [
          {
            createdAt: "2025-01-18T15:30:00.000Z",
            value: 50.5,
            isOutlier: true,
          },
        ],
      },
      {
        sensorMacAddress: "Sens02",
        stats: {
          mean: 13.377777777777776,
          variance: 159.75950617283945,
          upperThreshold: 38.65697920288925,
          lowerThreshold: -11.901423647333694,
          startDate: "2025-01-18T15:00:00.000Z",
          endDate: "2025-01-18T23:10:00.000Z",
        },
        measurements: [
          {
            createdAt: "2025-01-18T15:30:00.000Z",
            value: 45.8,
            isOutlier: true,
          },
        ],
      },
    ]);
  });

  it("should return 401 fot unauthorized access (invalid Token)", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/outliers")
      .set("Authorization", token + "1");

    expect(response.status).toBe(401);
  });

  it("should return 404 for Network not found", async () => {
    const tokenViewer = generateToken(TEST_USERS.viewer);
    const response = await request(app)
      .get("/api/v1/networks/Net04/outliers")
      .set("Authorization", `Bearer ${tokenViewer}`);

    expect(response.status).toBe(404);
  });

  it("should return 400 for invalid data", async () => {
    const response = await request(app)
      .get(
        "/api/v1/networks/Net02/outliers?startDate=2025-01-18T15:00:00+01:00&endDate=2025-01-18T16:20:00+01:00"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it("should get outlier measurements for a specific network with start-date and end-date", async () => {
    const response = await request(app)
      .get(
        "/api/v1/networks/Net02/outliers?startDate=2025-01-18T15%3A00%3A00%2B01%3A00&endDate=2025-01-18T16%3A20%3A00%2B01%3A00"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        sensorMacAddress: "Sens03",
        stats: {
          mean: 11.866666666666665,
          variance: 89.42888888888888,
          upperThreshold: 30.78003642341693,
          lowerThreshold: -7.046703090083598,
          startDate: "2025-01-18T14:00:00.000Z",
          endDate: "2025-01-18T15:20:00.000Z",
        },
      },
      {
        sensorMacAddress: "Sens02",
        stats: {
          mean: 11.633333333333333,
          variance: 64.46222222222222,
          upperThreshold: 27.691007165146235,
          lowerThreshold: -4.42434049847957,
          startDate: "2025-01-18T14:00:00.000Z",
          endDate: "2025-01-18T15:20:00.000Z",
        },
      },
    ]);
  });

  it("should get outlier measurements for a specific network with start-date and end-date and for a specific set of sensor", async () => {
    const response = await request(app)
      .get(
        "/api/v1/networks/Net02/outliers?sensorMacs=Sens02&startDate=2025-01-18T15%3A00%3A00%2B01%3A00&endDate=2025-01-18T16%3A20%3A00%2B01%3A00"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        sensorMacAddress: "Sens02",
        stats: {
          mean: 11.633333333333333,
          variance: 64.46222222222222,
          upperThreshold: 27.691007165146235,
          lowerThreshold: -4.42434049847957,
          startDate: "2025-01-18T14:00:00.000Z",
          endDate: "2025-01-18T15:20:00.000Z",
        },
      },
    ]);
  });

  it("should get outlier measurements for a specific network and for a specific set of sensors", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/outliers?sensorMacs=Sens02")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        sensorMacAddress: "Sens02",
        stats: {
          mean: 13.377777777777776,
          variance: 159.75950617283945,
          upperThreshold: 38.65697920288925,
          lowerThreshold: -11.901423647333694,
          startDate: "2025-01-18T15:00:00.000Z",
          endDate: "2025-01-18T23:10:00.000Z",
        },
        measurements: [
          {
            createdAt: "2025-01-18T15:30:00.000Z",
            value: 45.8,
            isOutlier: true,
          },
        ],
      },
    ]);
  });
});

describe("GET outlier measurements by Sensor", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2eMeasuerements();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("should get outlier measurements for a specific sensor", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/gateways/Gate03/sensors/Sens03/outliers")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      sensorMacAddress: "Sens03",
      stats: {
        mean: 13.811111111111112,
        variance: 206.1632098765432,
        upperThreshold: 42.527880419412014,
        lowerThreshold: -14.905658197189792,
        startDate: "2025-01-18T15:00:00.000Z",
        endDate: "2025-01-18T23:10:00.000Z",
      },
      measurements: [
        {
          createdAt: "2025-01-18T15:30:00.000Z",
          value: 50.5,
          isOutlier: true,
        },
      ],
    });
  });

  it("should return 401 fot unauthorized access (invalid Token)", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/gateways/Gate03/sensors/Sens03/outliers")
      .set("Authorization", token + "1");

    expect(response.status).toBe(401);
  });

  it("should return 404 for Sensor not found", async () => {
    const tokenViewer = generateToken(TEST_USERS.viewer);
    const response = await request(app)
      .get("/api/v1/networks/Net02/gateways/Gate03/sensors/Sens99/outliers")
      .set("Authorization", `Bearer ${tokenViewer}`);

    expect(response.status).toBe(404);
  });

  it("should return 404 for Gateway not found", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/gateways/Gate99/sensors/Sens03/outliers")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("should return 404 for Network not found", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net99/gateways/Gate03/sensors/Sens03/outliers")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("should return 400 for invalid data", async () => {
    const response = await request(app)
      .get(
        "/api/v1/networks/Net02/gateways/Gate03/sensors/Sens03/outliers?startDate=2025-01-18T15:00:00+01:00&endDate=2025-01-18T16:20:00+01:00"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it("should get outlier measurements for a specific sensor with start-date and end-date", async () => {
    const response = await request(app)
      .get(
        "/api/v1/networks/Net02/gateways/Gate03/sensors/Sens03/outliers?startDate=2025-01-18T15%3A00%3A00%2B01%3A00&endDate=2025-01-18T16%3A20%3A00%2B01%3A00"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      sensorMacAddress: "Sens03",
      stats: {
        startDate: "2025-01-18T14:00:00.000Z",
        endDate: "2025-01-18T15:20:00.000Z",
        mean: 11.866666666666665,
        variance: 89.42888888888888,
        upperThreshold: 30.78003642341693,
        lowerThreshold: -7.046703090083598,
      },
    });
  });
});

describe("GET measurements by Sensor", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2eMeasuerements();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("should get all measurements for a specific sensor", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/gateways/Gate03/sensors/Sens03/measurements")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      sensorMacAddress: "Sens03",
      stats: {
        mean: 13.811111111111112,
        variance: 206.1632098765432,
        upperThreshold: 42.527880419412014,
        lowerThreshold: -14.905658197189792,
        startDate: "2025-01-18T15:00:00.000Z",
        endDate: "2025-01-18T23:10:00.000Z",
      },
      measurements: [
        {
          createdAt: "2025-01-18T15:00:00.000Z",
          value: 6.1,
          isOutlier: false,
        },
        {
          createdAt: "2025-01-18T15:10:00.000Z",
          value: 25.2,
          isOutlier: false,
        },
        {
          createdAt: "2025-01-18T15:20:00.000Z",
          value: 4.3,
          isOutlier: false,
        },
        {
          createdAt: "2025-01-18T15:30:00.000Z",
          value: 50.5,
          isOutlier: false,
        },
        {
          createdAt: "2025-01-18T15:40:00.000Z",
          value: 4.7,
          isOutlier: false,
        },
        {
          createdAt: "2025-01-18T15:50:00.000Z",
          value: 4.9,
          isOutlier: false,
        },
        {
          createdAt: "2025-01-18T22:50:00.000Z",
          value: 10.5,
          isOutlier: false,
        },
        {
          createdAt: "2025-01-18T23:00:00.000Z",
          value: 6.7,
          isOutlier: false,
        },
        {
          createdAt: "2025-01-18T23:10:00.000Z",
          value: 11.4,
          isOutlier: false,
        },
      ],
    });
  });

  it("should get measurements for a specific sensor with date range", async () => {
    const response = await request(app)
      .get(
        "/api/v1/networks/Net02/gateways/Gate03/sensors/Sens03/measurements?startDate=2025-01-18T16%3A00%3A00%2B01%3A00&endDate=2025-01-18T16%3A30%3A00%2B01%3A00"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      sensorMacAddress: "Sens03",
      stats: {
        mean: 21.525,
        variance: 346.921875,
        upperThreshold: 58.77667781456293,
        lowerThreshold: -15.726677814562933,
        startDate: "2025-01-18T15:00:00.000Z",
        endDate: "2025-01-18T15:30:00.000Z",
      },
      measurements: [
        {
          createdAt: "2025-01-18T15:00:00.000Z",
          value: 6.1,
          isOutlier: false,
        },
        {
          createdAt: "2025-01-18T15:10:00.000Z",
          value: 25.2,
          isOutlier: false,
        },
        {
          createdAt: "2025-01-18T15:20:00.000Z",
          value: 4.3,
          isOutlier: false,
        },
        {
          createdAt: "2025-01-18T15:30:00.000Z",
          value: 50.5,
          isOutlier: false,
        },
      ],
    });
  });

  it("should return 401 for unauthorized access (invalid Token)", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/gateways/Gate03/sensors/Sens03/measurements")
      .set("Authorization", token + "1");

    expect(response.status).toBe(401);
  });

  it("should return 404 for Sensor not found", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/gateways/Gate03/sensors/Sens99/measurements")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("should return 404 for Gateway not found", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/gateways/Gate99/sensors/Sens03/measurements")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("should return 404 for Network not found", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net99/gateways/Gate03/sensors/Sens03/measurements")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("should return 400 for invalid data", async () => {
    const response = await request(app)
      .get(
        "/api/v1/networks/Net02/gateways/Gate03/sensors/Sens03/measurements?startDate=2025-01-18T15:00:00+01:00&endDate=2025-01-18T16:20:00+01:00"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});

describe("GET stats by Sensor", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2eMeasuerements();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("should get stats for a specific sensor", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/gateways/Gate03/sensors/Sens03/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      mean: 13.811111111111112,
      variance: 206.1632098765432,
      upperThreshold: 42.527880419412014,
      lowerThreshold: -14.905658197189792,
      startDate: "2025-01-18T15:00:00.000Z",
      endDate: "2025-01-18T23:10:00.000Z",
    });
  });

  it("should get stats for a specific sensor with date range", async () => {
    const response = await request(app)
      .get(
        "/api/v1/networks/Net02/gateways/Gate03/sensors/Sens03/stats?startDate=2025-01-18T16%3A00%3A00%2B01%3A00&endDate=2025-01-18T16%3A30%3A00%2B01%3A00"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      mean: 21.525,
      variance: 346.921875,
      upperThreshold: 58.77667781456293,
      lowerThreshold: -15.726677814562933,
      startDate: "2025-01-18T15:00:00.000Z",
      endDate: "2025-01-18T15:30:00.000Z",
    });
  });

  it("should return 401 for unauthorized access (invalid Token)", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/gateways/Gate03/sensors/Sens03/stats")
      .set("Authorization", token + "1");

    expect(response.status).toBe(401);
  });

  it("should return 404 for Sensor not found", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/gateways/Gate03/sensors/Sens99/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("should return 404 for Gateway not found", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net02/gateways/Gate99/sensors/Sens03/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("should return 404 for Network not found", async () => {
    const response = await request(app)
      .get("/api/v1/networks/Net99/gateways/Gate03/sensors/Sens03/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("should return 400 for invalid data", async () => {
    const response = await request(app)
      .get(
        "/api/v1/networks/Net02/gateways/Gate03/sensors/Sens03/stats?startDate=2025-01-18T15:00:00+01:00&endDate=2025-01-18T16:20:00+01:00"
      )
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});
