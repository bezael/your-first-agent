# Tu primer agente de IA

Taller de Dominicode en la Escola d'Enginyeria de la UAB. Un agente que usa herramientas, en TypeScript, **sin ninguna dependencia en tiempo de ejecución**.

## Antes del taller (10 minutos)

1. **Node 24.** Comprueba con `node --version` (tiene que empezar por `v24`). Si no, descárgalo de https://nodejs.org/en/download eligiendo la versión 24.x. Ojo: en diciembre la LTS que sale por defecto puede ser ya la 26.
2. **Descarga este repositorio** (o el zip), abre la carpeta en tu editor y ejecuta `npm install`.
3. **Consigue tu API key de Gemini, gratis:** entra en https://aistudio.google.com/apikey con tu cuenta de Google → *Create API key*.
4. Copia `.env.example` a `.env` y pega la key en `GEMINI_API_KEY=`.
5. Ejecuta `npm run step0`. Si el modelo te contesta, estás listo.

El agente no necesita dependencias para funcionar: solo usa `fetch`, que ya viene con Node. Haz `npm install` igualmente: instala los tipos de Node y TypeScript para que tu editor no marque `process` en rojo y te autocomplete. Con `npm run typecheck` compruebas los tipos.

## Los pasos

| Comando | Qué aprendes |
|---|---|
| `npm run step0` | Un LLM solo recibe mensajes y devuelve texto. No sabe ni qué hora es |
| `npm run step1` | Una herramienta es una descripción. El modelo **pide** que la ejecutes, no la ejecuta él |
| `npm run step2` | El bucle: ejecutas, le devuelves el resultado, repites. Eso es un agente |
| `npm run agent` | Un Claude Code en miniatura: lee y escribe ficheros en `workspace/` y te pide permiso antes de escribir. Aquí añades tu herramienta en `steps/tools.ts` |

## El agente del paso 3

Trabaja solo dentro de la carpeta `workspace/`, que trae dos ficheros de ejemplo (`tasks.md` y `meeting-notes.md`). Prueba a pedirle:

> Mira qué tengo en el workspace y créame un plan.md con las tareas pendientes ordenadas por fecha límite, diciendo cuántos días quedan para cada una.

Verás cómo encadena él solo `list_files`, `read_file`, `get_current_time` y `write_file`, y cómo te pregunta antes de guardar nada.

## Ideas para tu herramienta

- `roll_dice` — tira N dados (para que el modelo no se invente el azar)
- `count_words` — cuenta palabras o letras de un fichero (los LLM fallan con esto)
- `search_files` — busca un texto en todos los ficheros del workspace
- `get_weather` — el tiempo de una ciudad con https://open-meteo.com (gratis, sin key)
- `delete_file` — **reto:** tiene que pedir confirmación y no salir del workspace, como `write_file`
- `random_joke` — chiste de https://official-joke-api.appspot.com/random_joke
- `country_info` — capital y población desde https://restcountries.com
- `pokemon` — datos de un Pokémon desde https://pokeapi.co

## Si algo falla

- **`No API key found`** → no existe el `.env` o la key está vacía.
- **`429`** → demasiadas peticiones a la vez. Espera unos segundos; si tienes `OPENAI_API_KEY`, el agente cambia solo de proveedor.
- **`Unknown file extension ".ts"`** → tu Node es antiguo. Instala Node 24.
