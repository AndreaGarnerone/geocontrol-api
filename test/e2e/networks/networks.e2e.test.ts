import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import {
  beforeAllE2e,
  beforeAllE2eNetwork,
  afterAllE2e,
  TEST_USERS,
} from "@test/e2e/lifecycle";
import * as networkController from "@controllers/networkController";


describe("GET all networks with 3 entity", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2eNetwork();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("get all networks", async () => {
    const res = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);

    expect(res.body[0]).toStrictEqual({
      code: "Net01",
      name: "Rete 01",
      description: "Description of Network 01",
      gateways: [
        {
          macAddress: "Gate01",
          name: "Gateway 01",
          description: "Description of Gateway 01",
          sensors: [
            {
              macAddress: "Sens01",
              name: "Sensor 01",
              description: "Description of Sensor 01",
              variable: "temperature",
              unit: "gradi",
            },
            {
              macAddress: "Sens02",
              name: "Sensor 02",
              description: "Description of Sensor 02",
              variable: "humidity",
              unit: "percent",
            },
          ],
        },
        {
          macAddress: "Gate02",
          name: "Gateway 02",
          description: "Description of Gateway 02",
        },
      ],
    });
    expect(res.body[1]).toStrictEqual({
      code: "Net02",
      name: "Rete 02",
      description: "Description of Network 02",
      gateways: [
        {
          macAddress: "Gate03",
          name: "Gateway 03",
          description: "Description of Gateway 03",
        },
      ],
    });
    expect(res.body[2]).toStrictEqual({
      code: "Net03",
      name: "Rete 03",
      description: "Description of Network 03",
    });
  });

  it("get all networks 2", async () => {
    const res = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);

    expect(res.body).toStrictEqual([
      {
        code: "Net01",
        name: "Rete 01",
        description: "Description of Network 01",
        gateways: [
          {
            macAddress: "Gate01",
            name: "Gateway 01",
            description: "Description of Gateway 01",
            sensors: [
              {
                macAddress: "Sens01",
                name: "Sensor 01",
                description: "Description of Sensor 01",
                variable: "temperature",
                unit: "gradi",
              },
              {
                macAddress: "Sens02",
                name: "Sensor 02",
                description: "Description of Sensor 02",
                variable: "humidity",
                unit: "percent",
              },
            ],
          },
          {
            macAddress: "Gate02",
            name: "Gateway 02",
            description: "Description of Gateway 02",
          },
        ],
      },
      {
        code: "Net02",
        name: "Rete 02",
        description: "Description of Network 02",
        gateways: [
          {
            macAddress: "Gate03",
            name: "Gateway 03",
            description: "Description of Gateway 03",
          },
        ],
      },
      {
        code: "Net03",
        name: "Rete 03",
        description: "Description of Network 03",
      },
    ]);
  });

  it("get all networks", async () => {
    const res = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", `Bearer ${token + "1"}`);

    expect(res.status).toBe(401);
  });

  it("get all networks without token", async () => {
    const res = await request(app).get("/api/v1/networks");

    expect(res.status).toBe(401);
  });
});

describe("GET all networks with 0 entity", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("get all networks", async () => {
    const res = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);

    expect(res.body).toStrictEqual([]);
  });

  it("get all networks - should call next(error) on exception", async () => {
    // Mock getAllNetworks to throw
    jest
      .spyOn(networkController, "getAllNetworks")
      .mockImplementationOnce(() => {
        throw new Error("Test error");
      });

    const res = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500); // O il codice che il tuo error handler restituisce
    expect(res.body).toHaveProperty("message", "Test error");
  });
});

describe("Post  di una network", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2eNetwork();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("post a new network with admin token", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: "Net04",
        name: "Rete 04",
        description: "Description of Network 04",
      });

    expect(res.status).toBe(201);
  });

  it("post a new network with operator token", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`)
      .send({
        code: "Net05",
        name: "Rete 05",
        description: "Description of Network 05",
      });

    expect(res.status).toBe(201);
  });

  it("post a network with a invalid input  data", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Rete 04",
        description: "Description of Network 04",
      });

    expect(res.status).toBe(400);
  });

  it("post a network with a invalid token", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${token + "1"}`)
      .send({
        code: "Net05",
        name: "Rete 05",
        description: "Description of Network 05",
      });

    expect(res.status).toBe(401);
  });

  it("post a network without token", async () => {
    const res = await request(app).post("/api/v1/networks").send({
      code: "Net06",
      name: "Rete 06",
      description: "Description of Network 06",
    });

    expect(res.status).toBe(401);
  });

  it("post a network with a insufficient rights", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${generateToken(TEST_USERS.viewer)}`)
      .send({
        code: "Net07",
        name: "Rete 07",
        description: "Description of Network 07",
      });

    expect(res.status).toBe(403);
  });

  it("post a network with a duplicated code", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: "Net01",
        name: "Rete 01",
        description: "Description of Network 01",
      });

    expect(res.status).toBe(409);
  });
});

describe("get a network by code", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2eNetwork();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("get a network by code", async () => {
    const res = await request(app)
      .get("/api/v1/networks/Net01")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({
      code: "Net01",
      name: "Rete 01",
      description: "Description of Network 01",
      gateways: [
        {
          macAddress: "Gate01",
          name: "Gateway 01",
          description: "Description of Gateway 01",
          sensors: [
            {
              macAddress: "Sens01",
              name: "Sensor 01",
              description: "Description of Sensor 01",
              variable: "temperature",
              unit: "gradi",
            },
            {
              macAddress: "Sens02",
              name: "Sensor 02",
              description: "Description of Sensor 02",
              variable: "humidity",
              unit: "percent",
            },
          ],
        },
        {
          macAddress: "Gate02",
          name: "Gateway 02",
          description: "Description of Gateway 02",
        },
      ],
    });
  });

  it("get a network by code with invalid code", async () => {
    const res = await request(app)
      .get("/api/v1/networks/Net04")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("get a network by code with invalid token", async () => {
    const res = await request(app)
      .get("/api/v1/networks/Net01")
      .set("Authorization", `Bearer ${token + "1"}`);

    expect(res.status).toBe(401);
  });

  it("get a network by code without token", async () => {
    const res = await request(app).get("/api/v1/networks/Net01");

    expect(res.status).toBe(401);
  });
});

describe("Patch a network by code", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2eNetwork();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("patch a network by code with admin token (without code)", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/Net01")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Rete 01 Modificata",
        description: "Description of Network 01 Modified",
      });

    expect(res.status).toBe(204);
  });

  it("patch a network by code with admin token (without name)", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/Net01")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: "Net01",
        description: "Description of Network 01 Modified",
      });

    expect(res.status).toBe(204);
  });

  it("patch a network by code with admin token (without description)", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/Net01")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Rete 01 Modificata",
      });

    expect(res.status).toBe(204);
  });

  it("patch a network by code with operator token", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/Net02")
      .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`)
      .send({
        name: "Rete 02 Modificata",
        description: "Description of Network 02 Modified",
      });
    expect(res.status).toBe(204);
  });

  it("patch a network by code with wiewer token", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/Net03")
      .set("Authorization", `Bearer ${generateToken(TEST_USERS.viewer)}`)
      .send({
        name: "Rete 03 Modificata",
        description: "Description of Network 03 Modified",
      });

    expect(res.status).toBe(403);
  });

  it("patch a network by code with invalid code", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/Net04")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Rete 04 Modificata",
        description: "Description of Network 04 Modified",
      });

    expect(res.status).toBe(404);
  });

  it("patch a network by code with invalid token", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/Net01")
      .set("Authorization", `Bearer ${token + "1"}`)
      .send({
        name: "Rete 01 Modificata",
        description: "Description of Network 01 Modified",
      });

    expect(res.status).toBe(401);
  });

  it("patch a network by code without token", async () => {
    const res = await request(app).patch("/api/v1/networks/Net01").send({
      name: "Rete 01 Modificata",
      description: "Description of Network 01 Modified",
    });

    expect(res.status).toBe(401);
  });

  it("patch a network by code with invalid input data", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/Net01")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: "",
      });

    expect(res.status).toBe(400);
  });

  it("patch a network by code with duplicated code", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/Net01")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: "Net02",
        name: "Rete 01 Modificata",
        description: "Description of Network 01 Modified",
      });

    expect(res.status).toBe(409);
  });
});

describe("Delete a network by code", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2eNetwork();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("delete a network by code with admin token", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/Net01")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it("delete a network by code with operator token", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/Net03")
      .set("Authorization", `Bearer ${generateToken(TEST_USERS.operator)}`);

    expect(res.status).toBe(204);
  });

  it("delete a network by code with viewer token", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/Net03")
      .set("Authorization", `Bearer ${generateToken(TEST_USERS.viewer)}`);

    expect(res.status).toBe(403);
  });

  it("delete a network by code with invalid code", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/Net04")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("delete a network by code with invalid token", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/Net01")
      .set("Authorization", `Bearer ${token + "1"}`);

    expect(res.status).toBe(401);
  });

it("delete a network by code and verify it is removed", async () => {
  // Crea una nuova rete temporanea
  await request(app)
    .post("/api/v1/networks")
    .set("Authorization", `Bearer ${token}`)
    .send({
      code: "NetTemp",
      name: "Rete Temp",
      description: "Temp Network",
    });

  // Elimina la rete
  const delRes = await request(app)
    .delete("/api/v1/networks/NetTemp")
    .set("Authorization", `Bearer ${token}`);
  expect(delRes.status).toBe(204);

  // Verifica che non esista più
  const getRes = await request(app)
    .get("/api/v1/networks/NetTemp")
    .set("Authorization", `Bearer ${token}`);
  expect(getRes.status).toBe(404);
});

it("patch a network by code and verify changes", async () => {
  // Modifica la rete Net02
  const patchRes = await request(app)
    .patch("/api/v1/networks/Net02")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Rete 02 Aggiornata",
      description: "Descrizione aggiornata",
    });
  expect(patchRes.status).toBe(204);

  // Recupera la rete e verifica i cambiamenti
  const getRes = await request(app)
    .get("/api/v1/networks/Net02")
    .set("Authorization", `Bearer ${token}`);
  expect(getRes.status).toBe(200);
  expect(getRes.body).toStrictEqual({
    code: "Net02",
    name: "Rete 02 Aggiornata",
    description: "Descrizione aggiornata",
    gateways :[{
        macAddress: "Gate03",
        name: "Gateway 03",
        description: "Description of Gateway 03",
    }]
  });
});

});
