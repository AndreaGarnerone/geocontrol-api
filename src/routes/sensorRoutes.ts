import AppError from "@models/errors/AppError";
import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { createSensor, deleteSensor, updateSensor, getAllSensors, getSensor } from "@controllers/sensorController";
import { SensorFromJSON } from "@dto/Sensor";
import { UserType } from "@models/UserType";

const router = Router({ mergeParams: true });

// Get all sensors (Any authenticated user)
router.get("", authenticateUser(), async(req, res, next) => {
  try {
    const networkCode = req.params.networkCode;
    const gatewayMac = req.params.gatewayMac;
    res.status(200).json(await getAllSensors(networkCode, gatewayMac));
  } catch (error) {
    next(error);
  }
});

// Create a new sensor (Admin & Operator)
router.post("", authenticateUser([UserType.Admin, UserType.Operator]), async(req, res, next) => {
  try {
    const networkCode = req.params.networkCode;
    const gatewayMac = req.params.gatewayMac;
    await createSensor(networkCode, gatewayMac, SensorFromJSON(req.body));
    res.status(201).send();
  } catch (error) {
    next(error);
  }
});

// Get a specific sensor (Any authenticated user)
router.get("/:sensorMac", authenticateUser(), async(req, res, next) => {
  try {
    const networkCode = req.params.networkCode;
    const gatewayMac = req.params.gatewayMac;
    res.status(200).json( await getSensor(networkCode, gatewayMac, req.params.sensorMac));
  }
  catch (error) {
    next(error);
  }
});

// Update a sensor (Admin & Operator)
router.patch("/:sensorMac", authenticateUser([UserType.Admin, UserType.Operator]), async(req, res, next) => {
  try{
    const networkCode = req.params.networkCode;
    const gatewayMac = req.params.gatewayMac;
    res.status(204).send(await updateSensor(networkCode, gatewayMac, req.params.sensorMac, SensorFromJSON(req.body)));
  }
  catch (error) {
    next(error);
  }
});

// Delete a sensor (Admin & Operator)
router.delete("/:sensorMac", authenticateUser([UserType.Admin, UserType.Operator]), async(req, res, next) => {
  try{
    const networkCode = req.params.networkCode;
    const gatewayMac = req.params.gatewayMac;
    res.status(204).send(await deleteSensor(networkCode, gatewayMac, req.params.sensorMac));
  }
  catch (error) {
    next(error);
}
});

export default router;
