# Project Estimation part 2



Goal of this document is to compare actual effort and size of the project, vs the estimates made in task1.

## Computation of size

To compute the lines of code use cloc    
To install cloc:  
           `npm install -g cloc`   
On Windows, also a perl interpreter needs to be installed. You find it here https://strawberryperl.com/  
To run cloc  
           `cloc <directory containing ts files> --include-lang=TypeScript`  
As a result of cloc collect the *code* value (rightmost column of the result table)  
        

Compute two separate values of size  
-LOC of production code     `cloc <Geocontrol\src> --include-lang=TypeScript`  
-LOC of test code      `cloc <GeoControl\test> --include-lang=TypeScript`  


## Computation of effort 
From timesheet.md sum all effort spent, in **ALL** activities (task1, task2, task3) at the end of the project on June 7. Exclude task4

## Computation of productivity

productivity = ((LOC of production code)+ (LOC of test code)) / effort

productivity = ((2157)+(7159))/258 = 9316/258 = 36.1 LOC/hour


## Comparison

|                                        | Estimated (end of task 1) | Actual (june 7, end of task 3)|
| -------------------------------------------------------------------------------- | -------- |----|
| production code size | 3150 LOC  | 2157 LOC |
| test code size | unknown | 7159 LOC |
| total size  | 3150 LOC | 9316 LOC |
| effort | 303 person hours | 258 person hours |
| productivity  | 10 loc / hour | 36.1 loc / hour |

Report, as estimate of effort, the value obtained via activity decomposition technique.

- La stima dello sforzo ottenuta tramite la tecnica di decomposizione per attività è di **303 person hours**.
Il confronto tra le stime iniziali e i valori effettivi rivela alcune discrepanze:
  - Il codice di produzione (2157 LOC) è risultato inferiore del 31.5% rispetto alla stima (3150 LOC). Questo può essere attribuito a una buona modularità del codice che ha evitato duplicazioni inutili.
  - Il codice di test (7159 LOC) rappresenta una componente significativa non considerata nelle stime iniziali, ma del tutto adeguata al fine di raggiungere una coverage totale del codice.
  - La dimensione totale effettiva (9316 LOC) è quasi triplicata rispetto alla stima (3150 LOC), principalmente a causa dei test.  
  - Lo sforzo effettivo (258 person hours) è risultato leggermente diverso dalla stima iniziale (303 person hours), con uno scostamento di 45 ore.
  - La produttività effettiva (36.1 LOC/ora) è risultata più del triplo rispetto alla stima conservativa di 10 LOC/ora, mostrando una buona produttività del team nell' implementazione del codice .

Il progetto GeoControl ha dimostrato un buon controllo dei tempi e alta produttività. La principale discrepanza riguarda le dimensioni totali del codice, quasi triplicate principalmente per l'ampia copertura di test non considerata nelle stime iniziali. 
 



