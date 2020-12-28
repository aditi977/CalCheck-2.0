if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { mongoose, registerUser, loginUser, addFoodToCurrentUser, getCurrentUser } = require("./backend/server")
const fetch = require("node-fetch");
const session = require("express-session")
const { URL, URLSearchParams } = require('url')

const cors = require("cors");


app.set("view-engine", "ejs");
app.use(cors());
app.use(session({
    secret: process.env.SESSION_SECRET,
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 600000 }
}))
app.use(express.static('views'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.set('trust proxy', 1)

function isAuthenticated(req) {
    return req.session.autho ? true : false;
}

app.get('/is-mongoose-ok', function (req, res) {
    if (mongoose) {
        res.json({ isMongooseOk: !!mongoose.connection.readyState })
    } else {
        res.json({ isMongooseOk: false })
    }
});
app.get('/test-mongoose', function (req, res) {
    createAndSavePerson();
    res.json({ isMongooseOk: true })
});

app.get("/", (req, res) => {
    res.render("index.ejs", { loggedin: isAuthenticated(req) })
});

//Remove this later, I'm lazy
app.get("/index.html", (req, res) => {
    res.render("index.ejs", { loggedin: isAuthenticated(req) })
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});
app.post("/user/register", (req, res) => {
    registerUser(req.body.name, req.body.email, req.body.password, []);
    res.redirect("/login");

});
app.post("/user/login", async function (req, res, next) {
    try {
        req.session.autho = await loginUser(req.body.email, req.body.password);

        res.redirect("/");
    } catch (err) {
        next(err);
    }
});
app.get("/suggestions", (req, res) => {
    res.render("suggestions.ejs", { loggedin: isAuthenticated(req) });
});
app.get("/single-item", (req, res) => {
    res.render("single-item.ejs", { loggedin: isAuthenticated(req) });
});
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});
app.get("/history", async (req, res) => {
    const jsonFetch = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${req.session.autho}`
        },
        body: JSON.stringify({
            query: `{
                user {
                  name
                  foods {
                    name
                    date
                    nutritionixId
                    isCommonFood
                    imgSrc
                    calories
                  }
                }
              }
              `,
        })
    };


    const user = await getCurrentUser("test")
    res.render("history.ejs", { user, loggedin: true });
});
app.get("/search", (req, res) => {
    let searchURL = new URL("https://trackapi.nutritionix.com/v2/search/instant");
    let params = { query: req.query['search-key'] };
    searchURL.search = new URLSearchParams(params).toString();
    // console.log(JSON.stringify(bodyQuery));
    fetch(searchURL, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-app-id': 'dc50e0ed',
            'x-app-key': 'e4ba8175f2f600d999e22b205a8e402c'
        }
    }).then(res => res.json())
        .then(data => {
            res.render("post-search.ejs", { searchedFoods: data.common.concat(data.branded), loggedin: isAuthenticated(req) })
        })
        .catch(err => res.send(err));

});


function findNutrientsValue(full_nutrients) {
    return function (attr_id) {
        const attr = full_nutrients.find(elem => elem.attr_id === attr_id);
        if (attr) return attr.value
        return 0;

    }
}
app.get("/food/name/:foodname", (req, res) => {

    fetch("https://trackapi.nutritionix.com/v2/natural/nutrients", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            "x-app-id": "dc50e0ed",
            "x-app-key": "e4ba8175f2f600d999e22b205a8e402c"
        },
        body: JSON.stringify({
            query: req.params.foodname
        })
    }).then(res => res.json())
        .then(data => {
            const { full_nutrients, ...food } = data.foods[0]
            res.render("single-item.ejs", { food, foodURL: `/food/id/${req.params.foodname}`, nfByCode: findNutrientsValue(full_nutrients), loggedin: isAuthenticated(req) })
        }
        )
        .catch(err => res.send(err));
})


app.get("/food/id/:id", (req, res) => {

    fetch(`https://trackapi.nutritionix.com/v2/search/item?nix_item_id=${req.params.id}`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            "x-app-id": "dc50e0ed",
            "x-app-key": "e4ba8175f2f600d999e22b205a8e402c"
        }
    }).then(res => res.json())
        .then(data => {
            const { full_nutrients, ...food } = data.foods[0]
            res.render("single-item.ejs", { food, foodURL: `/food/id/${req.params.id}`, nfByCode: findNutrientsValue(full_nutrients), loggedin: isAuthenticated(req) })
        }
        )
        .catch(err => res.send(err));
})

app.post("/add-food", async (req, res) => {
    console.log(req.body)
    addFoodToCurrentUser("test", req.body.name, req.body.foodURL, req.body.imgSrc, req.body.calories);
});

// Not found middleware
app.use((req, res, next) => {
    return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
    let errCode, errMessage;

    if (err.errors) {
        // mongoose validation error
        errCode = 400; // bad request
        const keys = Object.keys(err.errors);
        // report the first validation error
        errMessage = err.errors[keys[0]].message;
    } else {
        // generic or custom error
        errCode = err.status || 500;
        errMessage = err.message || "Internal Server Error";
    }
    res
        .status(errCode)
        .type("txt")
        .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on http://localhost:" + listener.address().port);
});

