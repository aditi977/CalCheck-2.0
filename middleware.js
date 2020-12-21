// if (process.env.NODE_ENV !== 'production') {
//     require('dotenv').config()
// }
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
// const ejs = require("ejs");
const fetch = require("node-fetch");
const session = require("express-session")
const { URL, URLSearchParams } = require('url')

const cors = require("cors");
// const { encode } = require('punycode');

const fakeUser = {
    name: "q",
    password: "q",
    email: "q@gmail.com",
    gender: "email",
    foods: [
        {
            id: 1,
            name: "ramen",
            date: "5/13/2020",
            eatenBy: "AYTHNJFDS",
            isCommonFood:true,
            nutritionixId: "123456789",
            imgSrc: "img/history/sushi.jpg",
            calories:123,
        }
    ]
}

app.set("view-engine", "ejs");
app.use(cors());
app.use(session({
    secret: process.env.SESSION_SECRET,
    secret:"secret",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}))
// app.use(express.static('views/img'))
app.use(express.static('views'))
app.use(bodyParser.urlencoded({ extended: true }));


app.set('trust proxy', 1)

function isAuthenticated(req) {
    return req.session.autho ? true : false;
}

app.get("/", (req, res) => {
    res.render("index.ejs", { loggedin: isAuthenticated(req) })
});
app.get("/index.html", (req, res) => {
    res.render("index.ejs", { loggedin: isAuthenticated(req) })
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});
app.post("/user/register", (req, res) => {
    fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            query: `mutation{
                signup(name:"${req.body.name}",email:"${req.body.email}",password:"${req.body.password}"){
                    user{
                        name
                    }
                }
              }
            `
        })
    }).then(res => res.json())
        .then(data => {
            if (data.errors) {
                throw data.errors;
            } else {
                res.redirect("/login")
            }
        }
        )
        .catch(err => res.send(err));

});
app.post("/user/login", (req, res) => {
    fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            query: `mutation{
                login(email:"${req.body.email}",password:"${req.body.password}"){
                    token
                }   
            }
            `
        })
    }).then(res => res.json())
        .then(data => {
            if (data.errors) {
                throw data.errors;
            } else {
                req.session.autho = data.data.login.token;
                loggedin = isAuthenticated(req);
                res.redirect("/")
            }
        }
        )
        .catch(err => res.send(err));
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
app.get("/history", (req, res) => {
    fetch('http://localhost:4000/graphql', {
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
    })
        .then(r => r.json())
        .then(data => {
            if (data.errors) throw data.errors
            const { user } = data.data;
            res.render("history.ejs", { user, loggedin: isAuthenticated(req) });
        })
        .catch(err => {
            if (err[0].message === "jwt malformed") res.render("history.ejs", { user: { foods: [] }, allFoodsInfo: [], loggedin: isAuthenticated(req) });
        });
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
            console.log(full_nutrients)
            console.log(food)
            res.render("single-item.ejs", { food, nfByCode: findNutrientsValue(full_nutrients), loggedin: isAuthenticated(req) })
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
            console.log(full_nutrients)
            console.log(food)
            res.render("single-item.ejs", { food, nfByCode: findNutrientsValue(full_nutrients), loggedin: isAuthenticated(req) })
        }
        )
        .catch(err => res.send(err));
})

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


// query: `{
//     foods(filter:"${req.query['search-key']}"){
//       name
//       url_name
//       img_src
//     }
//   }
// `