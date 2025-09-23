// Importazione del modello Network e delle dipendenze necessarie
import { Network as NetworkDTO } from "@dto/Network";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { mapNetworkDAOToDTO } from "@services/mapperService";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";

// Funzione per ottenere tutti i network dal repository e convertirli in DTO
export async function getAllNetworks(): Promise<NetworkDTO[]> {
  const networkRepo = new NetworkRepository();
  const gatewayRepo = new GatewayRepository();
  const sensorRepo = new SensorRepository();
  const networks = await networkRepo.getAllNetworks();
  
  for (const network of networks) {
    const gateways = await gatewayRepo.getAllGateways(network.code);
    for (const gateway of gateways) {
      // Recupera i sensori per ogni gateway e li assegna
      gateway.sensors = await sensorRepo.getAllSensors(network.code, gateway.macAddress);
    }
    network.gateways = gateways; // Aggiorna i gateway con i sensori
  }
  
  return networks.map(mapNetworkDAOToDTO);
}

// Funzione per ottenere un singolo network tramite il suo codice identificativo
export async function getNetwork(code: string): Promise<NetworkDTO> {
  const networkRepo = new NetworkRepository(); // Istanzia il repository dei network
  const gatewayRepo = new GatewayRepository(); // Istanzia il repository dei gateway
  const sensorRepo = new SensorRepository(); // Istanzia il repository dei sensori
  const network = await networkRepo.getNetworkById(code); // Recupera il network specificato
  const gateways = await gatewayRepo.getAllGateways(code); // Recupera i gateway associati al network
  for (const gateway of gateways) {
      // Recupera i sensori per ogni gateway e li assegna
      gateway.sensors = await sensorRepo.getAllSensors(network.code, gateway.macAddress);
  }
  network.gateways = gateways; // Aggiorna i gateway con i sensori
  return mapNetworkDAOToDTO(network); // Recupera e converte il network in DTO
}

// Funzione per creare un nuovo network nel repository
export async function createNetwork(networkDto: NetworkDTO): Promise<void> {
  const networkRepo = new NetworkRepository(); // Istanzia il repository dei network
  // Crea un nuovo network utilizzando i dati forniti nel DTO
  await networkRepo.createNetwork(networkDto.code, networkDto.name, networkDto.description);
}

// Funzione per eliminare un network dal repository tramite il suo codice identificativo
export async function deleteNetwork(code: string): Promise<void> {
  const networkRepo = new NetworkRepository(); // Istanzia il repository dei network
  await networkRepo.deleteNetwork(code); // Elimina il network specificato
}

// Funzione per aggiornare un network esistente nel repository
export async function updateNetwork(oldcode: string, networkDto: NetworkDTO): Promise<void> {
  const networkRepo = new NetworkRepository(); // Istanzia il repository dei network
  // Aggiorna il network esistente con i nuovi dati forniti nel DTO
  await networkRepo.updateNetwork(oldcode, networkDto.code, networkDto.name, networkDto.description);
}