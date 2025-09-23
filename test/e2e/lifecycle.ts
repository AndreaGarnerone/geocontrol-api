import {
  initializeTestDataSource,
  closeTestDataSource,
} from "@test/setup/test-datasource";
import { UserRepository } from "@repositories/UserRepository";
import { UserType } from "@models/UserType";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { MeasurementRepository } from "@repositories/MeasurementRepository";

export const TEST_USERS = {
  admin: { username: "admin", password: "adminpass", type: UserType.Admin },
  operator: {
    username: "operator",
    password: "operatorpass",
    type: UserType.Operator,
  },
  viewer: { username: "viewer", password: "viewerpass", type: UserType.Viewer },
};

export async function beforeAllE2e() {
  await initializeTestDataSource();
  const repo = new UserRepository();
  await repo.createUser(
    TEST_USERS.admin.username,
    TEST_USERS.admin.password,
    TEST_USERS.admin.type
  );
  await repo.createUser(
    TEST_USERS.operator.username,
    TEST_USERS.operator.password,
    TEST_USERS.operator.type
  );
  await repo.createUser(
    TEST_USERS.viewer.username,
    TEST_USERS.viewer.password,
    TEST_USERS.viewer.type
  );
}

export async function beforeAllE2eNetwork() {
  await initializeTestDataSource();
  const repo = new UserRepository();
  await repo.createUser(
    TEST_USERS.admin.username,
    TEST_USERS.admin.password,
    TEST_USERS.admin.type
  );
  await repo.createUser(
    TEST_USERS.operator.username,
    TEST_USERS.operator.password,
    TEST_USERS.operator.type
  );
  await repo.createUser(
    TEST_USERS.viewer.username,
    TEST_USERS.viewer.password,
    TEST_USERS.viewer.type
  );

  const repoNet = new NetworkRepository();
  await repoNet.createNetwork("Net01", "Rete 01", "Description of Network 01");
  await repoNet.createNetwork("Net02", "Rete 02", "Description of Network 02");
  await repoNet.createNetwork("Net03", "Rete 03", "Description of Network 03");
  const repoGate = new GatewayRepository();
  await repoGate.createGateways(
    "Net01",
    "Gate01",
    "Gateway 01",
    "Description of Gateway 01"
  );
  await repoGate.createGateways(
    "Net01",
    "Gate02",
    "Gateway 02",
    "Description of Gateway 02"
  );
  await repoGate.createGateways(
    "Net02",
    "Gate03",
    "Gateway 03",
    "Description of Gateway 03"
  );

  const repoSens = new SensorRepository();
  await repoSens.createSensor(
    "Net01",
    "Gate01",
    "Sens01",
    "Sensor 01",
    "Description of Sensor 01",
    "temperature",
    "gradi"
  );
  await repoSens.createSensor(
    "Net01",
    "Gate01",
    "Sens02",
    "Sensor 02",
    "Description of Sensor 02",
    "humidity",
    "percent"
  );
}

export async function beforeAllE2eMeasuerements() {
  await initializeTestDataSource();
  const repo = new UserRepository();
  await repo.createUser(
    TEST_USERS.admin.username,
    TEST_USERS.admin.password,
    TEST_USERS.admin.type
  );
  await repo.createUser(
    TEST_USERS.operator.username,
    TEST_USERS.operator.password,
    TEST_USERS.operator.type
  );
  await repo.createUser(
    TEST_USERS.viewer.username,
    TEST_USERS.viewer.password,
    TEST_USERS.viewer.type
  );

  const repoNet = new NetworkRepository();
  await repoNet.createNetwork("Net01", "Rete 01", "Description of Network 01");
  await repoNet.createNetwork("Net02", "Rete 02", "Description of Network 02");
  await repoNet.createNetwork("Net03", "Rete 03", "Description of Network 03");

  const repoGate = new GatewayRepository();
  await repoGate.createGateways(
    "Net01",
    "Gate01",
    "Gateway 01",
    "Description of Gateway 01"
  );
  await repoGate.createGateways(
    "Net01",
    "Gate02",
    "Gateway 02",
    "Description of Gateway 02"
  );
  await repoGate.createGateways(
    "Net02",
    "Gate03",
    "Gateway 03",
    "Description of Gateway 03"
  );

  const repoSens = new SensorRepository();
  await repoSens.createSensor(
    "Net01",
    "Gate01",
    "Sens01",
    "Sensor 01",
    "Description of Sensor 01",
    "temperature",
    "gradi"
  );
  await repoSens.createSensor(
    "Net02",
    "Gate03",
    "Sens03",
    "Sensor 03",
    "Description of Sensor 03",
    "temperature",
    "gradi"
  );
  await repoSens.createSensor(
    "Net02",
    "Gate03",
    "Sens02",
    "Sensor 02",
    "Description of Sensor 02",
    "temperature",
    "gradi"
  )

  const repoMeas = new MeasurementRepository();
  // Popola Sens01 con i valori richiesti
  const measurements = [
    { createdAt: "2025-01-18T16:00:00+01:00", value: 5.8 },
    { createdAt: "2025-01-18T16:10:00+01:00", value: 24.9 },
    { createdAt: "2025-01-18T16:20:00+01:00", value: 4.0 },
    { createdAt: "2025-01-18T16:30:00+01:00", value: 26.1 },
    { createdAt: "2025-01-18T16:40:00+01:00", value: 4.3 },
    { createdAt: "2025-01-18T16:50:00+01:00", value: 4.4 },
    { createdAt: "2025-01-18T17:00:00+01:00", value: 4.5 },
    { createdAt: "2025-01-18T17:10:00+01:00", value: 2.6 },
    { createdAt: "2025-01-18T17:20:00+01:00", value: 4.7 },
    { createdAt: "2025-01-18T17:30:00+01:00", value: 4.8 },
    { createdAt: "2025-01-18T17:40:00+01:00", value: 4.9 },
    { createdAt: "2025-01-18T17:50:00+01:00", value: 5.1 },
    { createdAt: "2025-01-18T18:00:00+01:00", value: 5.2 },
    { createdAt: "2025-01-18T18:10:00+01:00", value: 5.3 },
    { createdAt: "2025-01-18T18:20:00+01:00", value: 5.4 },
    { createdAt: "2025-01-18T18:30:00+01:00", value: 5.5 },
    { createdAt: "2025-01-18T18:40:00+01:00", value: 5.6 },
    { createdAt: "2025-01-18T18:50:00+01:00", value: 5.7 },
    { createdAt: "2025-01-18T19:00:00+01:00", value: 5.9 },
    { createdAt: "2025-01-18T19:10:00+01:00", value: 6.0 },
    { createdAt: "2025-01-18T19:20:00+01:00", value: 6.1 },
    { createdAt: "2025-01-18T19:30:00+01:00", value: 6.2 },
    { createdAt: "2025-01-18T19:40:00+01:00", value: 6.3 },
    { createdAt: "2025-01-18T19:50:00+01:00", value: 6.4 },
    { createdAt: "2025-01-18T20:00:00+01:00", value: 6.5 },
    { createdAt: "2025-01-18T20:10:00+01:00", value: 6.7 },
    { createdAt: "2025-01-18T20:20:00+01:00", value: 6.8 },
    { createdAt: "2025-01-18T20:30:00+01:00", value: 6.9 },
    { createdAt: "2025-01-18T20:40:00+01:00", value: 7.0 },
    { createdAt: "2025-01-18T20:50:00+01:00", value: 7.1 },
    { createdAt: "2025-01-18T21:00:00+01:00", value: 7.2 },
    { createdAt: "2025-01-18T21:10:00+01:00", value: 7.3 },
    { createdAt: "2025-01-18T21:20:00+01:00", value: 7.5 },
    { createdAt: "2025-01-18T21:30:00+01:00", value: 7.6 },
    { createdAt: "2025-01-18T21:40:00+01:00", value: 7.7 },
    { createdAt: "2025-01-18T21:50:00+01:00", value: 7.8 },
    { createdAt: "2025-01-18T22:00:00+01:00", value: 7.9 },
    { createdAt: "2025-01-18T22:10:00+01:00", value: 8.0 },
    { createdAt: "2025-01-18T22:20:00+01:00", value: 8.1 },
    { createdAt: "2025-01-18T22:30:00+01:00", value: 8.3 },
    { createdAt: "2025-01-18T22:40:00+01:00", value: 8.4 },
    { createdAt: "2025-01-18T22:50:00+01:00", value: 8.5 },
    { createdAt: "2025-01-18T23:00:00+01:00", value: 8.6 },
    { createdAt: "2025-01-18T23:10:00+01:00", value: 8.7 },
    { createdAt: "2025-01-18T23:20:00+01:00", value: 8.8 },
    { createdAt: "2025-01-18T23:30:00+01:00", value: 8.9 },
    { createdAt: "2025-01-18T23:40:00+01:00", value: 9.1 },
    { createdAt: "2025-01-18T23:50:00+01:00", value: 10.2 },
    { createdAt: "2025-01-19T00:00:00+01:00", value: 6.3 },
    { createdAt: "2025-01-19T00:10:00+01:00", value: 11 },
  ];
  for (const m of measurements) {
    await repoMeas.createMeasurement(
      "Net01",
      "Gate01",
      "Sens01",
      m.createdAt,
      m.value
    );
  }

  const measurementsSens03 = [
    { createdAt: "2025-01-18T16:00:00+01:00", value: 6.1 },
    { createdAt: "2025-01-18T16:10:00+01:00", value: 25.2 },
    { createdAt: "2025-01-18T16:20:00+01:00", value: 4.3 },
    { createdAt: "2025-01-18T16:30:00+01:00", value: 50.5 },
    { createdAt: "2025-01-18T16:40:00+01:00", value: 4.7 },
    { createdAt: "2025-01-18T16:50:00+01:00", value: 4.9 },
    { createdAt: "2025-01-18T23:50:00+01:00", value: 10.5 },
    { createdAt: "2025-01-19T00:00:00+01:00", value: 6.7 },
    { createdAt: "2025-01-19T00:10:00+01:00", value: 11.4 },
  ];
  for (const m of measurementsSens03) {
    await repoMeas.createMeasurement(
      "Net02",
      "Gate03",
      "Sens03",
      m.createdAt,
      m.value
    );
  }

  const measurementsSens02 = [
    { createdAt: "2025-01-18T16:00:00+01:00", value: 8.3 },
    { createdAt: "2025-01-18T16:10:00+01:00", value: 22.7 },
    { createdAt: "2025-01-18T16:20:00+01:00", value: 3.9 },
    { createdAt: "2025-01-18T16:30:00+01:00", value: 45.8 },
    { createdAt: "2025-01-18T16:40:00+01:00", value: 5.2 },
    { createdAt: "2025-01-18T16:50:00+01:00", value: 5.4 },
    { createdAt: "2025-01-18T23:50:00+01:00", value: 9.8 },
    { createdAt: "2025-01-19T00:00:00+01:00", value: 7.1 },
    { createdAt: "2025-01-19T00:10:00+01:00", value: 12.2 },
  ];
  for (const m of measurementsSens02) {
    await repoMeas.createMeasurement(
      "Net02",
      "Gate03",
      "Sens02",
      m.createdAt,
      m.value
    );
  }

}

export async function afterAllE2e() {
  await closeTestDataSource();
}
