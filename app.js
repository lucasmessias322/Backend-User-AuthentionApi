require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

// models
const User = require("./models/User");

// Config JSON response
app.use(express.json());
const cors = require("cors");

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,PATCH,POST,DELETE");
  app.use(cors());
  next();
});

// Open Route
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Bem vindo a API!" });
});

// Private Route
app.get("/user/:id", checkToken, async (req, res) => {
  const id = req.params.id;

  // check if user exists
  const user = await User.findById(id, "-password");

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  }

  res.status(200).json({ user });
});

function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ msg: "Acesso negado!" });

  try {
    const secret = process.env.SECRET;

    jwt.verify(token, secret);

    next();
  } catch (err) {
    res.status(400).json({ msg: "O Token é inválido!" });
  }
}

app.post("/auth/register", async (req, res) => {
  const { name, email, password, confirmpassword } = req.body;

  // validations
  if (!name) {
    return res.status(422).json({ msg: "O nome é obrigatório!" });
  } else if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" });
  } else if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatória!" });
  } else if (password != confirmpassword) {
    return res
      .status(422)
      .json({ msg: "A senha e a confirmação precisam ser iguais!" });
  }

  // check if user exists
  const userExists = await User.findOne({ email: email });

  if (userExists) {
    return res.status(422).json({ msg: "Por favor, utilize outro e-mail!" });
  }

  // create password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // create user
  const user = new User({
    name,
    email,
    password: passwordHash,
  });

  try {
    await user.save();

    res
      .status(201)
      .json({ msg: "Usuário criado com sucesso!", userCriado: true });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // validations
  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" });
  }

  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatória!" });
  }

  // check if user exists
  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  }

  // check if password match
  const checkPassword = await bcrypt.compare(password, user.password);

  if (!checkPassword) {
    return res.status(422).json({ msg: "Senha inválida" });
  }

  try {
    const secret = process.env.SECRET;

    const token = jwt.sign(
      {
        id: user._id,
      },
      secret
    );

    const currentUser = await User.findById(user._id, "-password");

    res
      .status(200)
      .json({ currentUser, msg: "Autenticação realizada com sucesso!", token });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
});

app.patch("/auth/edit/:id", checkToken, (req, res) => {
  User.updateOne({ _id: req.params.id }, req.body, function (err, docs) {
    if (!err) {
      res.json({
        msg: "dados do usuario editado com sucesso",
        error: false,
        docs,
      });
    } else if (err) {
      res.json({
        error: true,
        msg: "Erro ao atualizar os dados do usuario",
        docs,
      });
    }
  });
});

app.get("/memorize/:id/item/:itemid", checkToken, async (req, res) => {
  const id = req.params.id;
  const ItemId = req.params.itemid;

  // check if user exists
  const user = await User.findById(id, "-password");

  // get memorize from user data
  const { memorize } = user;

  // get memorize index item
  const Memorize = memorize[ItemId];

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  } else if (Memorize) {
    res.status(200).json({ Memorize });
  } else {
    res.status(404).json({ msg: "esse memorize não existe!", error: true });
  }
});

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;
const Port = process.env.PORT || 8081;

mongoose
  .connect(
    `mongodb+srv://${dbUser}:${dbPassword}@cluster0.yhjpk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Conectou ao banco!");
    app.listen(Port);
    console.log(`Servidor rodando na porta: ${Port}`);
  })
  .catch((err) => console.log(err));
