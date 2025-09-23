import AppError from "@models/errors/AppError";
import { CONFIG } from "@config";
import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import * as authService from "@services/authService";
import { UserType } from "@models/UserType";
import { createMeasurement, getMeasurementsBySensor, getOutlierMeasurementsBySensor, getStatsBySensor, getMeasurementsByNetwork, getStatsByNetwork, getOutlierByNetwork } from "@controllers/measurementController";
import { MeasurementFromJSON } from "@models/dto/Measurement";
import { ERROR } from "sqlite3";

const router = Router();

// Store a measurement for a sensor (Admin & Operator)
router.post(CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/measurements", authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    const {networkCode, gatewayMac, sensorMac} = req.params;
    for (const measurement of req.body){
      try{
        await createMeasurement(
        networkCode,
        gatewayMac,
        sensorMac,
        MeasurementFromJSON(measurement)
        );   
      }catch (error){
        next(error);
      }    
    }
  res.status(201).send();     
  });

// Retrieve measurements for a specific sensor
router.get( 
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/measurements", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    const {networkCode, gatewayMac, sensorMac} = req.params;
    const {startDate, endDate} = req.query; 
    try{
      if (req.headers.authorization) {
        authService.processToken(req.headers.authorization); // lancia UnauthorizedError se malformato
      }
      res.status(200).json(await getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, startDate, endDate ));
    }catch (error){
      next(error);
    }
  }
);

// Retrieve statistics for a specific sensor
router.get(CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/stats", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), async (req, res, next) => {
  const {networkCode, gatewayMac, sensorMac} = req.params;
  const {startDate, endDate} = req.query;
  try{
      if (req.headers.authorization) {
        await authService.processToken(req.headers.authorization); // lancia UnauthorizedError se malformato
      }
      
      res.status(200).json(await getStatsBySensor(networkCode, gatewayMac, sensorMac, startDate, endDate ));
    }catch (error){
      next(error);
    }

});

// Retrieve only outliers for a specific sensor
router.get( 
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/outliers", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    const {networkCode, gatewayMac, sensorMac} = req.params;
    const {startDate, endDate} = req.query;
    try{
      res.status(200).json(await getOutlierMeasurementsBySensor(networkCode, gatewayMac, sensorMac, startDate, endDate ));
    }catch (error){
      next(error);
    }
  }
);

// Retrieve measurements for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/measurements", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    const {networkCode} = req.params;
    const {sensorMacs, startDate, endDate} = req.query;
    try{
      if (req.headers.authorization) {
        authService.processToken(req.headers.authorization); // lancia UnauthorizedError se malformato
      }
      res.status(200).json(await getMeasurementsByNetwork(networkCode, sensorMacs, startDate, endDate ));
    }catch (error){
            console.log("ERRORE: ", error.message);
      next(error);
    }

  }
);

// Retrieve statistics for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/stats", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    const {networkCode} = req.params;
    const {sensorMacs, startDate, endDate} = req.query;
    try{
      if (req.headers.authorization) {
        authService.processToken(req.headers.authorization); // lancia UnauthorizedError se malformato
      }
      res.status(200).json(await getStatsByNetwork(networkCode, sensorMacs, startDate, endDate ));
    }catch (error){
      next(error);
    }

  }

);

// Retrieve only outliers for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/outliers", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]),
  async (req, res, next) => {
    const {networkCode} = req.params;
    const {sensorMacs, startDate, endDate} = req.query;
    try{
      if (req.headers.authorization) {
        authService.processToken(req.headers.authorization); // lancia UnauthorizedError se malformato
      }
      res.status(200).json(await getOutlierByNetwork(networkCode, sensorMacs, startDate, endDate ));
    }catch (error){
      next(error);
    }

  }
);

export default router;
