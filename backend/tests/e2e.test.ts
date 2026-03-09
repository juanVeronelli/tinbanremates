import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";

const TEST_USER_EMAIL = "testuser@example.com";
const TEST_USER_PASSWORD = "Test1234!";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "Admin1234!";

async function resetDatabase() {
  // Orden respetando FKs
  await prisma.bid.deleteMany({});
  await prisma.auctionAttribute.deleteMany({});
  await prisma.auctionPhoto.deleteMany({});
  await prisma.auction.deleteMany({});
  await prisma.dynamicAttributeDef.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.creditRequest.deleteMany({});
  await prisma.user.deleteMany({});
}

async function createAdminUser() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  return prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      name: "Admin",
      role: "ADMIN",
    },
  });
}

describe("Tinban API e2e", () => {
  let userToken: string;
  let adminToken: string;
  let auctionId: string;
  let creditRequestId: string;
  let categoryId: string;
  let attributeId: string;

  beforeAll(async () => {
    await resetDatabase();
    await createAdminUser();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /api/health debe responder ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("POST /api/auth/register debe registrar un usuario", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      name: "Usuario Test",
      phone: "123456789",
    });
    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.token).toBeDefined();
  });

  it("POST /api/auth/login debe autenticar al usuario registrado", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_USER_EMAIL);
    expect(typeof res.body.token).toBe("string");
    userToken = res.body.token;
  });

  it("POST /api/auth/login debe autenticar al admin", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("ADMIN");
    adminToken = res.body.token;
  });

  it("GET /api/auth/profile debe devolver el perfil del usuario", async () => {
    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(TEST_USER_EMAIL);
  });

  it("POST /api/auth/credit-request debe crear una solicitud de crédito", async () => {
    const res = await request(app)
      .post("/api/auth/credit-request")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ amount: 100000, note: "Crédito de prueba" });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    creditRequestId = res.body.id;
  });

  it("GET /api/auth/credit-requests debe listar las solicitudes del usuario", async () => {
    const res = await request(app)
      .get("/api/auth/credit-requests")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/admin/credit-requests debe listar las solicitudes pendientes (admin)", async () => {
    const res = await request(app)
      .get("/api/admin/credit-requests")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/admin/credit-requests/:id/resolve debe aprobar la solicitud", async () => {
    const res = await request(app)
      .post(`/api/admin/credit-requests/${creditRequestId}/resolve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "APPROVED", adminNote: "Aprobado para pruebas" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("APPROVED");
  });

  it("POST /api/admin/categories debe crear una categoría", async () => {
    const res = await request(app)
      .post("/api/admin/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "Vehículos", slug: "vehiculos", sortOrder: 1 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    categoryId = res.body.id;
  });

  it("GET /api/admin/categories debe listar categorías", async () => {
    const res = await request(app)
      .get("/api/admin/categories")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/admin/attributes debe crear un atributo dinámico", async () => {
    const res = await request(app)
      .post("/api/admin/attributes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "color", label: "Color", type: "text", sortOrder: 1 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    attributeId = res.body.id;
  });

  it("GET /api/admin/attributes debe listar atributos dinámicos", async () => {
    const res = await request(app)
      .get("/api/admin/attributes")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/auctions debe crear una subasta (admin)", async () => {
    const res = await request(app)
      .post("/api/auctions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Auto de prueba",
        description: "Subasta de auto de prueba",
        minimumPrice: 1000,
        minIncrement: 100,
        categoryId,
        attributes: { color: "Rojo" },
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    auctionId = res.body.id;
  });

  it("GET /api/auctions debe listar subastas", async () => {
    const res = await request(app).get("/api/auctions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/auctions/categories debe listar categorías públicas", async () => {
    const res = await request(app).get("/api/auctions/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/auctions/attributes debe listar atributos públicos", async () => {
    const res = await request(app).get("/api/auctions/attributes");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/auctions/:id debe devolver el detalle de la subasta", async () => {
    const res = await request(app).get(`/api/auctions/${auctionId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(auctionId);
  });

  it("POST /api/auctions/:id/status debe cambiar el estado", async () => {
    const res = await request(app)
      .post(`/api/auctions/${auctionId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "ACTIVE" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ACTIVE");
  });

  it("POST /api/auctions/:id/bid debe permitir pujar (usuario con crédito aprobado)", async () => {
    const res = await request(app)
      .post(`/api/auctions/${auctionId}/bid`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ amount: 1100 });
    expect(res.status).toBe(201);
    expect(res.body.bid).toBeDefined();
  });

  it("GET /api/auctions/:id/bids debe devolver historial de pujas", async () => {
    const res = await request(app).get(`/api/auctions/${auctionId}/bids`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

