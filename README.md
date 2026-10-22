# Rick and Morty

Web application that consumes the public [Rick and Morty API](https://rickandmortyapi.com) and shows its characters, locations and episodes as cards. It is served by a Spring Boot application and the frontend is written in plain HTML, CSS and JavaScript. It does not use a database.

## Technologies

- Java 17
- Spring Boot 4.1.1 (Spring Web MVC)
- Maven (wrapper included)
- HTML, CSS and vanilla JavaScript (`fetch` API)
- External API: <https://rickandmortyapi.com/api/>

## Requirements

- JDK 17 or higher
- Internet connection (the data comes from the public API)

## Run

```bash
./mvnw spring-boot:run
```

On Windows:

```bash
mvnw.cmd spring-boot:run
```

Then open <http://localhost:8080/rickandmorty.html> in your browser.

## Features

- Three tabs, each one using a different endpoint of the API: **Personajes** (`/character`), **Ubicaciones** (`/location`) and **Episodios** (`/episode`).
- Search by name. The search shows its results after a 4 second delay (loading message included).
- Card for every result. Characters show their image, locations show their type and episodes show their code.
- Click on a card to open a pop up with a description built from the data of the item, plus related data loaded with nested requests (see below).
- Messages for loading, no results (API answers 404), API errors and connection problems.

## Nested endpoint consumption

The endpoints are chained: the response of one request contains the URLs used to make the next request.

| Selected item | Request 1                  | Request 2 (URL taken from request 1)                       | Request 3 (URL taken from request 2)                     |
| ------------- | -------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| Character     | `GET /character?name=`     | `GET {character.location.url}` → last location             | `GET /character/{ids}` using `location.residents` → other residents |
| Character     | `GET /character?name=`     | `GET {character.episode[0]}` → first episode               | —                                                        |
| Location      | `GET /location?name=`      | `GET /character/{ids}` using `location.residents`          | —                                                        |
| Episode       | `GET /episode?name=`       | `GET /character/{ids}` using `episode.characters`          | —                                                        |

Notes:

- Related characters are requested in a single call with the multiple-id form (`/character/1,2,3`), limited to the first 6 to 8 ids.
- If the user opens another pop up before the requests finish, the old answers are ignored.
- Only the first page of results returned by the API is shown (no pagination).

## Project structure

```
src/main
├── java/com/rickandmorty/rickandmorty
│   └── RickandmortyApplication.java    Spring Boot entry point
└── resources/static
    ├── rickandmorty.html               Page structure
    ├── rickandmorty.css                Styles
    └── rickandmorty.js                 API calls and page logic
```

## Git workflow

- `main` always contains the stable version.
- Every change is developed in its own `feature/*` branch and merged into `main` through a Pull Request.
- Every commit is made inside a feature branch, so it is linked to the feature it belongs to.

## License

This project is licensed under the [MIT License](LICENSE).

Rick and Morty characters, names and images belong to their respective owners (Adult Swim / Warner Bros. Discovery). Data and images are obtained from the free [Rick and Morty API](https://rickandmortyapi.com) and are used here for educational purposes only.

## Author

Your name here
