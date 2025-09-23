import { Router} from "express";
import {getAllGateways,getGateway,createGateway,updateGateway,deleteGateway} from "@controllers/gatewayController";
import {Gateway as GatewayDTO, GatewayFromJSON} from "@dto/Gateway";
import {authenticateUser} from "@middlewares/authMiddleware";
import {UserType} from "@models/UserType";

const router = Router({ mergeParams: true });

// Get all gateways (Any authenticated user)
router.get("", authenticateUser(), async (req, res, next) => {
  try {
    const networkCode = req.params.networkCode;
    const gateways = await getAllGateways(networkCode);
    res.status(200).json(gateways);
  } catch (error) {
    next(error);
  }
});

// Create a new gateway (Admin & Operator)
router.post("", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
    const networkCode = req.params.networkCode;
    await createGateway(networkCode, GatewayFromJSON(req.body));
    res.status(201).send();
  } catch (error) {
    next(error);
  }
});

// Get a specific gateway (Any authenticated user)
router.get("/:gatewayMac", authenticateUser(), async (req, res, next) => {
  try {
    const networkCode = req.params.networkCode;
    const gatewayMac = req.params.gatewayMac;
    const gateway = await getGateway(networkCode, gatewayMac);
    res.status(200).json(gateway);
  } catch (error) {
    next(error);
  }
});

// Update a gateway (Admin & Operator)
router.patch("/:gatewayMac", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
    const networkCode = req.params.networkCode;
    const gatewayMac = req.params.gatewayMac;
    const gatewayDto: GatewayDTO = req.body;
    await updateGateway(networkCode, gatewayMac, gatewayDto);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Delete a gateway (Admin & Operator)
router.delete("/:gatewayMac", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
    const networkCode = req.params.networkCode;
    const gatewayMac = req.params.gatewayMac;
    await deleteGateway(networkCode, gatewayMac);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
