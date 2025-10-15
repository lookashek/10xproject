export const e2eUser = {
  id: process.env.E2E_USERNAME_ID ?? "test-user-id",
  email: process.env.E2E_USERNAME ?? "test@test.pl",
  password: process.env.E2E_PASSWORD ?? "test1234",
};
