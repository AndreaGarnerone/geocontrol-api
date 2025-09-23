import AppError from "@models/errors/AppError";
import { Router } from "express";
import { createNetwork, deleteNetwork, updateNetwork, getAllNetworks, getNetwork } from "@controllers/networkController";
import { NetworkFromJSON } from "@dto/Network";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";

const router = Router();

// Get all networks (Any authenticated user)
// Route: GET /
// Description: Retrieves a list of all networks.
// Middleware: Requires any authenticated user.
router.get("", authenticateUser(), async (req, res, next) => {
  try {
    res.status(200).json(await getAllNetworks());
  } catch (error) {
    next(error);
  }
});

// Create a new network (Admin & Operator)
// Route: POST /
// Description: Creates a new network using the data provided in the request body.
// Middleware: Requires authentication as Admin or Operator.
router.post("", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
    await createNetwork(NetworkFromJSON(req.body));
    res.status(201).send(); // Responds with HTTP 201 Created.
  } catch (error) {
    next(error);
  }
});

// Get a specific network (Any authenticated user)
// Route: GET /:networkCode
// Description: Retrieves details of a specific network identified by its networkCode.
// Middleware: Requires any authenticated user.
router.get("/:networkCode", authenticateUser(), async (req, res, next) => {
  try {
    res.status(200).json(await getNetwork(req.params.networkCode));
  } catch (error) {
    next(error);
  }
});

// Update a network (Admin & Operator)
// Route: PATCH /:networkCode
// Description: Updates the details of a specific network identified by its networkCode.
// Middleware: Requires authentication as Admin or Operator.
router.patch("/:networkCode", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
    await updateNetwork(req.params.networkCode, NetworkFromJSON(req.body));
    res.status(204).send(); // Responds with HTTP 204 No Content.
  } catch (error) {
    next(error);
  }
});

// Delete a network (Admin & Operator)
// Route: DELETE /:networkCode
// Description: Deletes a specific network identified by its networkCode.
// Middleware: Requires authentication as Admin or Operator.
router.delete("/:networkCode", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
    await deleteNetwork(req.params.networkCode);
    res.status(204).send(); // Responds with HTTP 204 No Content.
  } catch (error) {
    next(error);
  }
});

export default router;
