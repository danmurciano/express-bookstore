process.env.NODE_ENV = "test";
const request = require("supertest");

const app = require("../app");
const db = require("../db");

let book;

beforeEach(async function () {
  let result = await db.query(
    `INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
       VALUES(
         '069116151',
         'http://a.co/eobPtX2',
         'Matthew Lane',
         'english',
         264,
         'Princeton University Press',
         'An Average Book',
         2017)
       RETURNING isbn`);

  book = result.rows[0].isbn;
});


describe("GET /books", function () {
  test("Gets all books", async function () {
    let res = await request(app).get("/books")
    expect(res.statusCode).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0]).toHaveProperty("amazon_url");
  });
});

describe("GET /books/:isbn", function () {
  test("Gets a single book", async function () {
    const res = await request(app).get(`/books/${book}`)
    expect(res.body.book.isbn).toBe(book);
  });

  test("Responds with 404 if book can't be found", async function () {
    const response = await request(app).get(`/books/no-such-book`)
    expect(response.statusCode).toBe(404);
  });
});


describe("POST /books", function () {
  test("Creates a book", async function () {
    let response = await request(app)
      .post("/books")
      .send({
        isbn: "0691174652",
        amazon_url: "http://a.co/eobu567",
        author: "Stephen King",
        language: "english",
        pages: 450,
        publisher: "Publish House",
        title: "The Shining",
        year: 1974
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.author).toBe("Stephen King");
    expect(response.body.book.title).toBe("The Shining");
  });

  test("Throws an error when there are missing fields", async function () {
    let response = await request(app)
      .post("/books")
      .send({
        amazon_url: "http://a.co/eobu567",
        author: "Stephen King",
        language: "english",
        pages: 450,
        publisher: "Publish House",
        title: "The Shining",
        year: 1974
      });

    expect(response.statusCode).toBe(400);
  });
});


describe("PUT /books/:isbn", function () {
  test("Updates a single book", async function () {
    const response = await request(app)
        .put(`/books/${book}`)
        .send({
          amazon_url: "https://taco.com",
          author: "new-author",
          language: "french",
          pages: 300,
          publisher: "new-publisher",
          title: "A New Book",
          year: 2018
        });
    expect(response.statusCode).toBe(200);
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.author).toBe("new-author");
    expect(response.body.book.title).toBe("A New Book");
  });
});


describe("DELETE /books/:isbn", function () {
  test("Deletes a single book", async function () {
    const res = await request(app).delete(`/books/${book}`)
    expect(res.body).toEqual({ message: "Book deleted" });
  });

  test("Responds with 404 if book can't be found", async function () {
    const res = await request(app).delete(`/books/no-such-book`)
    expect(res.statusCode).toBe(404);
  });
});


afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});


afterAll(async function () {
  await db.end()
});
