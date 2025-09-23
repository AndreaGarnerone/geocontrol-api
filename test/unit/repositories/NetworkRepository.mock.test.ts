import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { NetworkDAO } from "@dao/NetworkDAO";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";

// Mock TypeORM and database dependencies
jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

// Mock utils functions
jest.mock("@utils", () => ({
  findOrThrowNotFound: jest.fn(),
  throwConflictIfFound: jest.fn(),
}));

describe("NetworkRepository Unit Tests", () => {
  let networkRepo: NetworkRepository;
  let mockRepository: jest.Mocked<Repository<NetworkDAO>>;
  
  const mockNetwork: NetworkDAO = {
    networkId: 1,
    code: "test_net",
    name: "Test Network",
    description: "Test Description",
    gateways: [],
  };

  // Helper per estrarre il codice dalla clausola where
  const getCodeFromWhere = (where: any): string | null => {
    if (!where) return null;
    if (Array.isArray(where)) return null;
    return where.code;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Crea un mock repository TypeORM
    mockRepository = {
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<Repository<NetworkDAO>>;

    // Configura AppDataSource per ritornare il mock repository
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    
    // Crea un'istanza del repository da testare
    networkRepo = new NetworkRepository();
  });

  // getAllNetworks
  describe("getAllNetworks", () => {
    it("should return all networks", async () => {
      mockRepository.find.mockResolvedValue([mockNetwork]);
      
      const result = await networkRepo.getAllNetworks();
      
      expect(result).toEqual([mockNetwork]);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no networks", async () => {
      mockRepository.find.mockResolvedValue([]);
      
      const result = await networkRepo.getAllNetworks();
      
      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it("should handle errors", async () => {
      mockRepository.find.mockRejectedValue(new Error("DB error"));
      
      await expect(networkRepo.getAllNetworks()).rejects.toThrow("DB error");
    });
  });

  // getNetworkById
  describe("getNetworkById", () => {
    it("should return network when found", async () => {
      // Configura utility mock
      (findOrThrowNotFound as jest.Mock).mockImplementation((data) => data[0]);
      
      mockRepository.find.mockResolvedValue([mockNetwork]);
      
      const result = await networkRepo.getNetworkById("test_net");
      
      expect(result).toEqual(mockNetwork);
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { code: "test_net" } });
    });

    it("should call findOrThrowNotFound with correct predicate", async () => {
      mockRepository.find.mockResolvedValue([mockNetwork]);
      
      await networkRepo.getNetworkById("test_net");
      
      const calls = (findOrThrowNotFound as jest.Mock).mock.calls;
      expect(calls.length).toBe(1);
      
      const [data, predicate, message] = calls[0];
      expect(data).toEqual([mockNetwork]);
      expect(predicate).toBeInstanceOf(Function);
      expect(predicate()).toBe(true);
      expect(message).toBe("Network with id 'test_net' not found");
    });

    it("should throw error when network not found", async () => {
      // Configura utility per lanciare errore
      (findOrThrowNotFound as jest.Mock).mockImplementation(() => {
        throw new Error("Not found");
      });
      
      mockRepository.find.mockResolvedValue([]);
      
      await expect(networkRepo.getNetworkById("invalid_code")).rejects.toThrow("Not found");
    });
  });

  // createNetwork
  describe("createNetwork", () => {
    it("should create new network", async () => {
      mockRepository.save.mockResolvedValue(mockNetwork);
      
      const result = await networkRepo.createNetwork(
        "test_net",
        "Test Network",
        "Test Description"
      );
      
      expect(result).toEqual(mockNetwork);
      expect(mockRepository.save).toHaveBeenCalledWith({
        code: "test_net",
        name: "Test Network",
        description: "Test Description",
      });
    });

    it("should call throwConflictIfFound with correct predicate", async () => {
      mockRepository.find.mockResolvedValue([]);
      
      await networkRepo.createNetwork("test_net", "Test", "Desc");
      
      const calls = (throwConflictIfFound as jest.Mock).mock.calls;
      expect(calls.length).toBe(1);
      
      const [data, predicate, message] = calls[0];
      expect(data).toEqual([]);
      expect(predicate).toBeInstanceOf(Function);
      expect(predicate()).toBe(true);
      expect(message).toBe("Network with id 'test_net' already exists");
    });

    it("should throw conflict when network exists", async () => {
      // Configura utility per lanciare conflitto
      (throwConflictIfFound as jest.Mock).mockImplementation(() => {
        throw new Error("Conflict");
      });
      
      mockRepository.find.mockResolvedValue([mockNetwork]);
      
      await expect(
        networkRepo.createNetwork("test_net", "Test", "Desc")
      ).rejects.toThrow("Conflict");
    });

    it("should handle save errors", async () => {
      // Configura per nessun conflitto
      mockRepository.find.mockResolvedValue([]);
      (throwConflictIfFound as jest.Mock).mockImplementation(() => {});
      
      // Configura errore al salvataggio
      mockRepository.save.mockRejectedValue(new Error("Save failed"));
      
      await expect(
        networkRepo.createNetwork("test_net", "Test", "Desc")
      ).rejects.toThrow("Save failed");
    });
  });

  // updateNetwork
  describe("updateNetwork", () => {
    it("should update network without code change", async () => {
      // Configura find per network esistente
      mockRepository.find.mockImplementation(async (options) => {
        const code = getCodeFromWhere(options?.where);
        if (code === "test_net") return [mockNetwork];
        return [];
      });
      
      // Configura getNetworkById
      (findOrThrowNotFound as jest.Mock).mockImplementation((data) => data[0]);
      
      await networkRepo.updateNetwork(
        "test_net",
        "test_net", // Stesso codice
        "Updated Name",
        "Updated Description"
      );
      
      expect(mockRepository.update).toHaveBeenCalledWith(
        { code: "test_net" },
        {
          code: "test_net",
          name: "Updated Name",
          description: "Updated Description",
        }
      );
    });

    it("should update network with code change", async () => {
      // Configura find
      mockRepository.find.mockImplementation(async (options) => {
        const code = getCodeFromWhere(options?.where);
        if (code === "test_net") return [mockNetwork];
        if (code === "new_code") return [];
        return [];
      });
      
      // Configura getNetworkById
      (findOrThrowNotFound as jest.Mock).mockImplementation((data) => data[0]);
      
      await networkRepo.updateNetwork(
        "test_net",
        "new_code", // Nuovo codice
        "Updated Name",
        "Updated Description"
      );
      
      expect(mockRepository.update).toHaveBeenCalledWith(
        { code: "test_net" },
        {
          code: "new_code",
          name: "Updated Name",
          description: "Updated Description",
        }
      );
    });

    it("should call throwConflictIfFound with correct predicate for new code", async () => {
      // Configura find
      mockRepository.find.mockImplementation(async (options) => {
        const code = getCodeFromWhere(options?.where);
        if (code === "test_net") return [mockNetwork];
        if (code === "new_code") return [];
        return [];
      });
      
      // Configura getNetworkById
      (findOrThrowNotFound as jest.Mock).mockImplementation((data) => data[0]);
      
      await networkRepo.updateNetwork(
        "test_net",
        "new_code", // Nuovo codice
        "Updated Name",
        "Updated Description"
      );
      
      const calls = (throwConflictIfFound as jest.Mock).mock.calls;
      expect(calls.length).toBe(1);
      
      const [data, predicate, message] = calls[0];
      expect(data).toEqual([]);
      expect(predicate).toBeInstanceOf(Function);
      expect(predicate()).toBe(true);
      expect(message).toBe("Network with code 'new_code' already exists");
    });

    it("should throw conflict when new code exists", async () => {
      // Configura find
      mockRepository.find.mockImplementation(async (options) => {
        const code = getCodeFromWhere(options?.where);
        if (code === "test_net") return [mockNetwork];
        if (code === "existing_code") return [mockNetwork];
        return [];
      });
      
      // Configura utility per lanciare conflitto
      (throwConflictIfFound as jest.Mock).mockImplementation(() => {
        throw new Error("Conflict");
      });
      
      // Configura getNetworkById
      (findOrThrowNotFound as jest.Mock).mockImplementation((data) => data[0]);
      
      await expect(
        networkRepo.updateNetwork(
          "test_net",
          "existing_code", // Codice esistente
          "Updated Name",
          "Updated Description"
        )
      ).rejects.toThrow("Conflict");
    });

    it("should handle partial updates", async () => {
      const existingNetwork = { 
        ...mockNetwork,
        name: "Original Name",
        description: "Original Description",
      };
      
      // Configura find
      mockRepository.find.mockImplementation(async (options) => {
        const code = getCodeFromWhere(options?.where);
        if (code === "test_net") return [existingNetwork];
        return [];
      });
      
      // Configura getNetworkById
      (findOrThrowNotFound as jest.Mock).mockImplementation((data) => data[0]);
      
      await networkRepo.updateNetwork(
        "test_net",
        undefined, // Nessun cambio codice
        undefined, // Nessun cambio nome
        "Updated Description" // Solo descrizione
      );
      
      expect(mockRepository.update).toHaveBeenCalledWith(
        { code: "test_net" },
        {
          code: "test_net",
          name: "Original Name",
          description: "Updated Description",
        }
      );
    });

    it("should handle getNetworkById error", async () => {
      // Configura utility per lanciare errore
      (findOrThrowNotFound as jest.Mock).mockImplementation(() => {
        throw new Error("Not found");
      });
      
      mockRepository.find.mockResolvedValue([]);
      
      await expect(
        networkRepo.updateNetwork("invalid_code", "new_code")
      ).rejects.toThrow("Not found");
    });
  });

  // deleteNetwork
  describe("deleteNetwork", () => {
    it("should delete network", async () => {
      // Configura find
      mockRepository.find.mockResolvedValue([mockNetwork]);
      mockRepository.remove.mockResolvedValue(mockNetwork);
      
      // Configura getNetworkById
      (findOrThrowNotFound as jest.Mock).mockImplementation((data) => data[0]);
      
      await networkRepo.deleteNetwork("test_net");
      
      expect(mockRepository.remove).toHaveBeenCalledWith(mockNetwork);
    });

    it("should throw error when network not found", async () => {
      // Configura utility per lanciare errore
      (findOrThrowNotFound as jest.Mock).mockImplementation(() => {
        throw new Error("Not found");
      });
      
      mockRepository.find.mockResolvedValue([]);
      
      await expect(
        networkRepo.deleteNetwork("invalid_code")
      ).rejects.toThrow("Not found");
    });

    it("should handle remove errors", async () => {
      // Configura find
      mockRepository.find.mockResolvedValue([mockNetwork]);
      mockRepository.remove.mockRejectedValue(new Error("Delete failed"));
      
      // Configura getNetworkById
      (findOrThrowNotFound as jest.Mock).mockImplementation((data) => data[0]);
      
      await expect(
        networkRepo.deleteNetwork("test_net")
      ).rejects.toThrow("Delete failed");
    });
  });
});