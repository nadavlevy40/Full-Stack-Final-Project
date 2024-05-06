import request from "supertest";
import App from "../app";
import mongoose from "mongoose";
import { Express } from "express";
import Donor from "../models/donor_model";
//THE DONOR MODEL IS NOT DEFINED YET

let app: Express;
const donor = {
  firstName: "John",
  lastName: "Doe",
  phoneMunber: "0521234567",
  address: "Haifa",
  _id:"12345678",
  email: "testUser@test.com",
  password: "12345678",
}

beforeAll(async () => {
    process.env.JWT_EXPIRATION = '3s'
    app=App;
    //app = await initApp();
    console.log("beforeAll");
    await Donor.deleteMany({ 'email': donor.email });
});

afterAll(async () => {
    await mongoose.connection.close();
});

let accessToken: string;
let refreshToken: string;
let newRefreshToken: string

describe("Auth tests", () => {

  test("Test Register", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(donor);
    expect(response.statusCode).toBe(201);
  });

  test("Test Register exist email", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(donor);
    expect(response.statusCode).toBe(406);
  });

  test("Test Register missing password", async () => {
    const response = await request(app)
      .post("/api/auth/register").send({
        email: "test@test.com",
      });
    expect(response.statusCode).toBe(400);
  });

  test("Test Register missing email", async () => {
    const response = await request(app)
      .post("/api/auth/register").send({
        password: "123456789",
      });

    expect(response.statusCode).toBe(400);
  });

  test("Test Register missing email and password", async () => {
    const response = await request(app)
      .post(".api/auth/register").send({});
    expect(response.statusCode).toBe(400);
  });

  test("Test Login with Incorrect Credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "wrong_password" });
    expect(response.statusCode).toBe(401);
  });


  test("Test Login", async () => {
    const response = await request(app)
      .post("/api/auth/login").send(donor);
    expect(response.statusCode).toBe(200);
    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;
    expect(accessToken).toBeDefined();
    expect(response.body._id).toBe(donor._id);
  });

  test("Test Login without password", async () => {
    const response = await request(app)
      .post("/api/auth/login").send({
        email: "test@test.com",});
    expect(response.statusCode).toBe(400);

  });

  test("Test Login with wrong password", async () => {
    const response = await request(app)
      .post("/api/auth/login").send({
        email: "test@test.com",
      password: "123456789"});
    expect(response.statusCode).toBe(401);

  });

  test("Test Login without username and password", async () => {
    const response = await request(app)
      .post("/api/auth/login").send({});
    expect(response.statusCode).toBe(400);

  });

  test("Test Login with Missing Fields", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({});
    expect(response.statusCode).toBe(400);
});


  test("Test forbidden access without token", async () => {
    const response = await request(app).get("/api/donor");
    expect(response.statusCode).toBe(401);
  });

  test("Test access with valid token", async () => {
    const response = await request(app)
      .get("/api/donor")
      .set("Authorization", "JWT " + accessToken);
    expect(response.statusCode).toBe(200);
  });

  test("Test access with invalid token", async () => {
    const response = await request(app)
      .get("/api/donor")
      .set("Authorization", "JWT 1" + accessToken);
    expect(response.statusCode).toBe(401);
  });

  jest.setTimeout(10000);

  test("Test access after timeout of token", async () => {
    await new Promise(resolve => setTimeout(() => resolve("done"), 5000));

    const response = await request(app)
      .get("/api/donor")
      .set("Authorization", "JWT " + accessToken);
    expect(response.statusCode).not.toBe(200);
    console.log("response.statusCode of timeout: " +response.statusCode);
  });

 
  test("Test refresh token", async () => {
    console.log("Test refresh token: " + refreshToken);
    const response = await request(app)
      .get("/api/auth/refreshToken")
      .set("Authorization", "JWT " + refreshToken)
      .send();
      console.log("response.statusCode: " +response.statusCode);
    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    const newAccessToken = response.body.accessToken;
    newRefreshToken = response.body.refreshToken;

    const response2 = await request(app)
      .get("/api/donor")
      .set("Authorization", "JWT " + newAccessToken);
    expect(response2.statusCode).toBe(200);
  });

  test("Test double use of refresh token", async () => {
    const response = await request(app)
      .get("/api/auth/refreshToken")
      .set("Authorization", "JWT " + refreshToken)
      .send();
      console.log("response.statusCode double use : " +response.statusCode);
    expect(response.statusCode).toBe(401);

    //verify that the new token is not valid as well
    const response1 = await request(app)
      .get("/api/auth/refreshToken")
      .set("Authorization", "JWT " + newRefreshToken)
      .send();
    expect(response1.statusCode).not.toBe(200);
    console.log("new refresh token from double 2: " + response.statusCode);
  });

  let LogOutaccessToken: string;
  let LogOutrefreshToken: string;

  test("Test Login", async () => {
    const response = await request(app)
      .post("/api/auth/login").send(donor);
    expect(response.statusCode).toBe(200);
    LogOutaccessToken = response.body.accessToken;
    LogOutrefreshToken = response.body.refreshToken;
    expect(LogOutaccessToken).toBeDefined();
    expect(LogOutrefreshToken).toBeDefined();
  });

  test("Test Logout without Token", async () => {
    const response = await request(app).get("/api/auth/logout");
    expect(response.statusCode).toBe(401);
  });

  test("Test Logout with Invalid Token", async () => {
    const response = await request(app)
      .get("/api/auth/logout")
      .set("Authorization", "JWT invalid_token");
    expect(response.statusCode).toBe(401);
  });


  test("Test logout", async () => {
    const response = await request(app)
      .get("/api/auth/logout")
      .set("Authorization", "JWT " + LogOutrefreshToken)
      .send();
    expect(response.statusCode).toBe(200);

  });

  test("Test logout for the second time", async () => {
    const response = await request(app)
      .get("/api/auth/logout")
      .set("Authorization", "JWT " + LogOutrefreshToken)
      .send();
    expect(response.statusCode).not.toBe(200);
  });

});




