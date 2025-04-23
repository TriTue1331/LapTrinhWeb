const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const url = "mongodb://127.0.0.1:27017";
const dbName = "mydatabase";
const client = new MongoClient(url);
const collectionname = "pets";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "public/images")));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = uuidv4() + ext;
    cb(null, filename);
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

let petsCollection;

async function startServer() {
  try {
    await client.connect();
    console.log("✅ Kết nối MongoDB thành công!");

    const db = client.db(dbName);
    petsCollection = db.collection(collectionname);

    app.listen(port, () => {
      console.log(`🚀 Server chạy tại http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Lỗi khi kết nối MongoDB:", error);
  }
}

startServer();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/page/index.html"));
});

app.get("/add.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/page/add.html"));
});

app.get("/update.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/page/update.html"));
});


// Thêm Pet
app.post("/addPet", upload.single("image"), async (req, res) => {
  try {
    if (!petsCollection) throw new Error("Collection chưa được khởi tạo");

    const { id, name, age, price, species, gender, describe } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!id || !name || !age || !price || !species || !gender || !describe) {
      return res.status(400).json({ message: "Thiếu thông tin thú cưng!" });
    }

    const newPet = {
      ID: id,
      Name: name,
      Age: parseInt(age),
      Price: parseInt(price),
      Species: species,
      Gender: gender,
      Describe: describe,
      Image: image,
    };

    await petsCollection.insertOne(newPet);
    console.log("✅ Thêm thú cưng:", newPet);
    res.json({ message: "Thêm thành công!", pet: newPet });
  } catch (error) {
    console.error("❌ Lỗi khi thêm thú cưng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Update PET
app.post("/updatePet", upload.single("petImage"), async (req, res) => {
  try {
    const { id, name, age, price, species, gender, describe } = req.body;
    const image = req.file ? req.file.filename : null;

    const updateFields = {
      Name: name,
      Age: parseInt(age),
      Price: parseInt(price),
      Species: species,
      Gender: gender,
      Describe: describe,
    };

    if (image) {
      updateFields.Image = image;
    }

    const result = await petsCollection.updateOne(
      { ID: id },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thú cưng để cập nhật!" });
    }

    console.log("✅ Cập nhật thú cưng:", id);
    res.json({ message: "Cập nhật thành công!" });
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật thú cưng:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật!" });
  }
});

// Danh sách PET
app.get("/dsPET", async (req, res) => {
  try {
    if (!petsCollection) throw new Error("Collection chưa được khởi tạo");

    const pets = await petsCollection.find({}).toArray();
    console.log("📦 Danh sách thú cưng gửi về:", pets);
    res.json(pets);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách thú cưng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ❗ API xoá pet từ MongoDB
app.delete("/delete-pet", async (req, res) => {
  try {
    if (!petsCollection) throw new Error("Collection chưa được khởi tạo");

    const filter = req.body; // Dữ liệu gửi từ client
    console.log("📥 Điều kiện xoá:", filter);

    const result = await petsCollection.deleteMany(filter);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Không tìm thấy pet phù hợp để xoá" });
    }

    res.json({ message: "Xoá pet thành công", deletedCount: result.deletedCount });
  } catch (error) {
    console.error("❌ Lỗi khi xoá pet:", error);
    res.status(500).json({ message: "Lỗi server khi xoá pet" });
  }
});

