const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;  // خلي المنفذ من المتغير البيئي أو 3000 افتراضياً

app.use(express.json());
app.use(cors());

const config = {
    user: process.env.DB_USER,                  // من متغير البيئة
    password: process.env.DB_PASSWORD,          // من متغير البيئة
    server: process.env.DB_SERVER,              // من متغير البيئة
    database: process.env.DB_DATABASE,          // من متغير البيئة
    port: parseInt(process.env.DB_PORT) || 1433, // من متغير البيئة أو 1433
    options: {
        encrypt: false,
        enableArithAbort: true
    }
};


sql.connect(config).then(pool => {
    if (pool.connected) console.log("Connected to MSSQL");

    
app.get('/api/users', async (req, res) => {
  try {
    const result = await sql.query('SELECT * FROM Table_user');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'فشل في جلب المستخدمين', details: err });
  }
});

// ✅ جلب مستخدم محدد
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await sql.query`SELECT * FROM Table_user WHERE no_user = ${id}`;
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ error: 'المستخدم غير موجود' });
    }
  } catch (err) {
    res.status(500).json({ error: 'فشل في جلب المستخدم', details: err });
  }
});

// ✅ تحديث وقت الدخول الأخير
app.put('/api/users/:id/last-login', async (req, res) => {
  const { id } = req.params;
  const { datetime } = req.body;
  try {
    await sql.query`UPDATE Table_user SET datetime_last_login = ${datetime} WHERE no_user = ${id}`;
    res.json({ message: 'تم تحديث وقت الدخول' });
  } catch (err) {
    res.status(500).json({ error: 'فشل في التحديث', details: err });
  }
});
// حذف مستخدم محدد
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await sql.query`DELETE FROM Table_user WHERE no_user = ${id}`;
    if (result.rowsAffected[0] > 0) {
      res.json({ message: 'تم حذف المستخدم' });
    } else {
      res.status(404).json({ error: 'المستخدم غير موجود' });
    }
  } catch (err) {
    res.status(500).json({ error: 'فشل في حذف المستخدم', details: err });
  }
});

app.post('/api/users', async (req, res) => {
  const { na_user, password, stop_user, date_add_user, datetime_last_login, datetime_last_exit } = req.body;
  try {
    const result = await sql.query`
      INSERT INTO Table_user (na_user, password, stop_user, date_add_user, datetime_last_login, datetime_last_exit)
      VALUES (${na_user}, ${password}, ${stop_user}, ${date_add_user}, ${datetime_last_login}, ${datetime_last_exit})
    `;
    res.status(201).json({ message: 'تم إضافة المستخدم' });
  } catch (err) {
    res.status(500).json({ error: 'فشل في إضافة المستخدم', details: err });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { na_user, password, stop_user, date_add_user, datetime_last_login, datetime_last_exit } = req.body;
  try {
    const result = await sql.query`
      UPDATE Table_user SET
        na_user = ${na_user},
        password = ${password},
        stop_user = ${stop_user},
        date_add_user = ${date_add_user},
        datetime_last_login = ${datetime_last_login},
        datetime_last_exit = ${datetime_last_exit}
      WHERE no_user = ${id}
    `;
    if (result.rowsAffected[0] > 0) {
      res.json({ message: 'تم تحديث المستخدم' });
    } else {
      res.status(404).json({ error: 'المستخدم غير موجود' });
    }
  } catch (err) {
    res.status(500).json({ error: 'فشل في تحديث المستخدم', details: err });
  }
});


app.get('/api/mualif', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT * FROM Table_mualif');

    const dataWithBase64 = result.recordset.map(row => {
      return {
        ...row,
        pic_mualif: row.pic_mualif ? Buffer.from(row.pic_mualif).toString('base64') : null
      };
    });

    res.json(dataWithBase64);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// ✅ إضافة مؤلف
app.post('/api/mualif', async (req, res) => {
  const { na_mualif, nationality, acdemc, cpecialty, pic_mualif } = req.body;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('na_mualif', sql.NVarChar, na_mualif)
      .input('nationality', sql.NVarChar, nationality)
      .input('acdemc', sql.NVarChar, acdemc)
      .input('cpecialty', sql.NVarChar, cpecialty)
      .input('pic_mualif', sql.VarBinary(sql.MAX), Buffer.from(pic_mualif, 'base64'))
      .query(`INSERT INTO Table_mualif (na_mualif, nationality, acdemc, cpecialty, pic_mualif)
              VALUES (@na_mualif, @nationality, @acdemc, @cpecialty, @pic_mualif)`);

    res.send("تمت الإضافة");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ✅ تعديل مؤلف
app.put('/api/mualif/:id', async (req, res) => {
  const id = req.params.id;
  const { na_mualif, nationality, acdemc, cpecialty, pic_mualif } = req.body;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('no_mualif', sql.Int, id)
      .input('na_mualif', sql.NVarChar, na_mualif)
      .input('nationality', sql.NVarChar, nationality)
      .input('acdemc', sql.NVarChar, acdemc)
      .input('cpecialty', sql.NVarChar, cpecialty)
      .input('pic_mualif', sql.VarBinary(sql.MAX), Buffer.from(pic_mualif, 'base64'))
      .query(`UPDATE Table_mualif SET na_mualif=@na_mualif, nationality=@nationality, acdemc=@acdemc, cpecialty=@cpecialty, pic_mualif=@pic_mualif WHERE no_mualif=@no_mualif`);

    res.send("تم التعديل");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ✅ حذف مؤلف
app.delete('/api/mualif/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('no_mualif', sql.Int, id)
      .query('DELETE FROM Table_mualif WHERE no_mualif = @no_mualif');

    res.send("تم الحذف");
  } catch (err) {
    res.status(500).send(err.message);
  }
});


app.get('/api/book', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT * FROM Table_book');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// إضافة كتاب جديد
app.post('/api/book', async (req, res) => {
  const { na_book, no_page, date_pub, house_pub } = req.body;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('na_book', sql.NVarChar, na_book)
      .input('no_page', sql.Int, no_page)
      .input('date_pub', sql.Date, date_pub)
      .input('house_pub', sql.NVarChar, house_pub)
      .query(`INSERT INTO Table_book (na_book, no_page, date_pub, house_pub)
              VALUES (@na_book, @no_page, @date_pub, @house_pub)`);
    res.status(201).send("تمت الإضافة");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// تعديل كتاب
app.put('/api/book/:id', async (req, res) => {
  const id = req.params.id;
  const { na_book, no_page, date_pub, house_pub } = req.body;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('no_book', sql.Int, id)
      .input('na_book', sql.NVarChar, na_book)
      .input('no_page', sql.Int, no_page)
      .input('date_pub', sql.Date, date_pub)
      .input('house_pub', sql.NVarChar, house_pub)
      .query(`UPDATE Table_book SET
                na_book = @na_book,
                no_page = @no_page,
                date_pub = @date_pub,
                house_pub = @house_pub
              WHERE no_book = @no_book`);
    res.send("تم التعديل");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// حذف كتاب
app.delete('/api/book/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('no_book', sql.Int, id)
      .query('DELETE FROM Table_book WHERE no_book = @no_book');
    res.send("تم الحذف");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/api/company', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`SELECT no_com, na_com_ar, na_com_en, adress_ar, adress_en, mobile, maill, pic_com FROM Table_company`);
    const data = result.recordset.map(row => ({
      ...row,
      pic_com: row.pic_com ? Buffer.from(row.pic_com).toString('base64') : null
    }));
    res.json(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// إضافة شركة
app.post('/api/company', async (req, res) => {
  const { na_com_ar, na_com_en, adress_ar, adress_en, mobile, maill, pic_com } = req.body;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('na_com_ar', sql.NVarChar, na_com_ar)
      .input('na_com_en', sql.NVarChar, na_com_en)
      .input('adress_ar', sql.NVarChar, adress_ar)
      .input('adress_en', sql.NVarChar, adress_en)
      .input('mobile', sql.NVarChar, mobile)
      .input('maill', sql.NVarChar, maill)
      .input('pic_com', sql.VarBinary(sql.MAX), pic_com ? Buffer.from(pic_com, 'base64') : null)
      .query(`INSERT INTO Table_company (na_com_ar, na_com_en, adress_ar, adress_en, mobile, maill, pic_com)
              VALUES (@na_com_ar, @na_com_en, @adress_ar, @adress_en, @mobile, @maill, @pic_com)`);
    res.send('تمت الإضافة');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// تعديل شركة موجودة
app.put('/api/company/:id', async (req, res) => {
  const id = req.params.id;
  const { na_com_ar, na_com_en, adress_ar, adress_en, mobile, maill, pic_com } = req.body;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('no_com', sql.Int, id)
      .input('na_com_ar', sql.NVarChar, na_com_ar)
      .input('na_com_en', sql.NVarChar, na_com_en)
      .input('adress_ar', sql.NVarChar, adress_ar)
      .input('adress_en', sql.NVarChar, adress_en)
      .input('mobile', sql.NVarChar, mobile)
      .input('maill', sql.NVarChar, maill)
      .input('pic_com', sql.VarBinary(sql.MAX), pic_com ? Buffer.from(pic_com, 'base64') : null)
      .query(`UPDATE Table_company
              SET na_com_ar=@na_com_ar, na_com_en=@na_com_en,
                  adress_ar=@adress_ar, adress_en=@adress_en,
                  mobile=@mobile, maill=@maill, pic_com=@pic_com
              WHERE no_com=@no_com`);
    res.send('تم التعديل');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// حذف شركة (اختياري)
app.delete('/api/company/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('no_com', sql.Int, id)
      .query('DELETE FROM Table_company WHERE no_com = @no_com');
    res.send('تم الحذف');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/api/book_author', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const sqlQuery = `
      SELECT
        no_writn,
        Table_book.no_book,
        Table_book.na_book,
        Table_mualif.no_mualif,
        Table_mualif.na_mualif
      FROM Table_bookmualif
      INNER JOIN Table_book ON Table_bookmualif.no_book = Table_book.no_book
      INNER JOIN Table_mualif ON Table_bookmualif.no_mualif = Table_mualif.no_mualif
    `;
    const result = await pool.request().query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// إضافة علاقة كتاب - مؤلف
app.post('/api/book_author', async (req, res) => {
  const { no_book, no_mualif } = req.body;
  try {
    const pool = await sql.connect(config);
    // تأكد من عدم وجود العلاقة مسبقًا
    const checkQuery = `
      SELECT COUNT(*) AS count FROM Table_bookmualif
      WHERE no_book = @no_book AND no_mualif = @no_mualif
    `;
    const checkResult = await pool.request()
      .input('no_book', sql.Int, no_book)
      .input('no_mualif', sql.Int, no_mualif)
      .query(checkQuery);

    if (checkResult.recordset[0].count > 0) {
      return res.status(400).json({ message: "هذا الكتاب مرتبط بهذا المؤلف بالفعل" });
    }

    const insertQuery = `
      INSERT INTO Table_bookmualif (no_book, no_mualif)
      VALUES (@no_book, @no_mualif)
    `;
    await pool.request()
      .input('no_book', sql.Int, no_book)
      .input('no_mualif', sql.Int, no_mualif)
      .query(insertQuery);

    res.send("تمت الإضافة");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// تعديل علاقة كتاب - مؤلف
app.put('/api/book_author/:id', async (req, res) => {
  const id = req.params.id;
  const { no_book, no_mualif } = req.body;
  try {
    const pool = await sql.connect(config);

    // تأكد من عدم تكرار العلاقة مع سجل آخر
    const checkQuery = `
      SELECT COUNT(*) AS count FROM Table_bookmualif
      WHERE no_book = @no_book AND no_mualif = @no_mualif AND no_writn != @id
    `;
    const checkResult = await pool.request()
      .input('no_book', sql.Int, no_book)
      .input('no_mualif', sql.Int, no_mualif)
      .input('id', sql.Int, id)
      .query(checkQuery);

    if (checkResult.recordset[0].count > 0) {
      return res.status(400).json({ message: "هذا الكتاب مرتبط بهذا المؤلف بالفعل" });
    }

    const updateQuery = `
      UPDATE Table_bookmualif
      SET no_book = @no_book, no_mualif = @no_mualif
      WHERE no_writn = @id
    `;
    await pool.request()
      .input('no_book', sql.Int, no_book)
      .input('no_mualif', sql.Int, no_mualif)
      .input('id', sql.Int, id)
      .query(updateQuery);

    res.send("تم التعديل");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// حذف علاقة كتاب - مؤلف
app.delete('/api/book_author/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const pool = await sql.connect(config);
    const deleteQuery = `
      DELETE FROM Table_bookmualif WHERE no_writn = @id
    `;
    await pool.request()
      .input('id', sql.Int, id)
      .query(deleteQuery);

    res.send("تم الحذف");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ✅ جلب جميع الكتب
app.get('/api/book_author/book', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT * FROM Table_book');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ✅ جلب جميع المؤلفين
app.get('/api/book_author/mualif', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT * FROM Table_mualif');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});



app.listen(port, () => console.log(`Server running on port ${port}`));
}).catch(err => console.error("Database connection failed:", err));
