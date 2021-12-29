const baseRoute = require("../core/routerConfig");
const { sendEmailVerificationToken } = require("../utils/sendgrid");

baseRoute.get("/", (req, res) =>
  res
    .status(200)
    .send(
      '<code>Ventmode Backend Running...<a target="_blank" href="https://documenter.getpostman.com/view/7896471/TzsikPQV" style="text-decoration: none; cursor: pointer; color: black; font-weight: bold">&lt;Go To Docs/&gt;</a></code>'
    )
);

baseRoute.post("/api/send-token", (req, res) => {
  const email = req.body.email;
  const removeWhiteSpace = email.replace(/\s+/g, " ").trim();
  return sendEmailVerificationToken(removeWhiteSpace)
    .then((response) => res.status(response.status).json(response))
    .catch((error) => res.status(error.status).json(error));
});

module.exports = baseRoute;
