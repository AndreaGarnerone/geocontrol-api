import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { NetworkDAO } from "@dao/NetworkDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";

export class NetworkRepository {
  private repo: Repository<NetworkDAO>;

  constructor() {
    // Inizializza il repository TypeORM per la gestione dei dati di NetworkDAO
    this.repo = AppDataSource.getRepository(NetworkDAO);
  }

  // Recupera tutti i record di rete dal database
  async getAllNetworks(): Promise<NetworkDAO[]> {
    return this.repo.find();
  }

  // Recupera un record di rete specifico in base al codice
  async getNetworkById(code: string): Promise<NetworkDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { code } }),
      () => true,
      `Network with id '${code}' not found` // Messaggio di errore se il record non viene trovato
    );
  }

  // Crea un nuovo record di rete nel database
  async createNetwork(
    code: string,
    name: string,
    description: string
  ): Promise<NetworkDAO> {
    // Controlla se esiste già un record con lo stesso codice
    throwConflictIfFound(
      await this.repo.find({ where: { code } }),
      () => true,
      `Network with id '${code}' already exists` // Messaggio di errore in caso di conflitto
    );

    // Salva il nuovo record nel database
    return this.repo.save({
      code: code,
      name: name,
      description: description,
    });
  }

  // Aggiorna un record di rete esistente
  async updateNetwork(
    currentCode: string,
    newCode?: string,
    name?: string,
    description?: string
  ): Promise<void> {
    // Verifica che il record con currentCode esista
    const network = await this.getNetworkById(currentCode);

    // Se il codice è cambiato, verifica che il nuovo codice non sia già in uso
    if (newCode !== undefined && newCode !== currentCode) {
      throwConflictIfFound(
        await this.repo.find({ where: { code: newCode } }),
        () => true,
        `Network with code '${newCode}' already exists`
      );
    }

    // Prepara i dati da aggiornare, usando i nuovi valori se forniti, altrimenti quelli vecchi
    const updateData = {
      code: newCode ?? network.code,
      name: name ?? network.name,
      description: description ?? network.description,
    };

    // Esegui l'aggiornamento usando il metodo 'update'
    await this.repo.update({ code: currentCode }, updateData);
  }

  // Elimina un record di rete in base al codice
  async deleteNetwork(code: string): Promise<void> {
    // Recupera il record e lo rimuove dal database
    await this.repo.remove(await this.getNetworkById(code));
  }
}
