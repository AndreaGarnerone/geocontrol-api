# Project Estimation

Date: 11/04/2025

Version: 1

# Estimation approach

Consider the GeoControl project as described in the swagger, assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch
<br><br>

# Estimate by size

|                                                                                                         | Estimate |
| ------------------------------------------------------------------------------------------------------- | -------- |
| NC = Estimated number of classes to be developed                                                        | 30       |
| A = Estimated average size per class, in LOC                                                            | 105      |
| S = Estimated size of project, in LOC (= NC \* A)                                                       | 3150     |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)                    | 315      |
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro)                                     | 9450     |
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) | 2        |
<br>

## Estimate by product decomposition
###

| component name       | Estimated effort (person hours) |
| -------------------- | ------------------------------- |
| requirement document | 42                              |
| GUI prototype        | 24                              |
| design document      | 36                              |
| code                 | 120                             |
| unit tests           | 45                              |
| api tests            | 30                              |
| management documents | 12                              |

<br>

# Estimate by activity decomposition

###

| Activity name            | Estimated effort (person hours) |
| ------------------------ | ------------------------------- |
| Analisi dei requisiti    | 30                              |
| Gui Prototype            | 48                              |
| Progettazione del design | 18                              |
| Design dettagliato       | 18                              |
| Backend                  | 72                              |
| API                      | 12                              |
| Frontend                 | 48                              |
| Test unità               | 18                              |
| Test API                 | 27                              |
| Statistica               | 12                              |
| Documentazione           | 12                              |
| Sistema di notifica      | 18                              |



###

![alt text](Gantt.png)

# Summary

|                                    | Estimated effort | Estimated duration |
| ---------------------------------- | ---------------- | ------------------ |
| estimate by size                   | 315              | 1,96 week(s)       |
| estimate by product decomposition  | 273              | 1,70 week(s)       |
| estimate by activity decomposition | 303              | 1,89 week(s)       |

Per quanto riguarda la stima basata sulla dimensione, il risultato può variare molto in base al linguaggio di programmazione scelto e allo stile del programmatore: ad esempio, un codice più compatto o scritto con librerie/framework ad alto livello può influenzare notevolmente il numero di righe e quindi il tempo stimato. Anche le ore effettive che ogni membro del team può o vuole dedicare al codice hanno ovviamente un impatto.
<br>
Con la stima per decomposizione del prodotto, abbiamo ottenuto un valore un po’ più basso rispetto alla stima per attività. Questo perché nella decomposizione per attività si entra più nel dettaglio: si scompone il lavoro in azioni concrete e specifiche, e questo permette di cogliere anche piccoli compiti che magari, a un livello più alto, non verrebbero considerati. È quindi naturale che questa stima risulti un po’ più “pesante”, ma anche più realistica.