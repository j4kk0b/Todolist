//IMPORTING NPMS
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();


//SWITCHING ENGINE TO EJS
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));



//  CONNECTING TO DB AND GIVING SAMPLE TASKS

mongoose.connect(process.env.DATABASE_KEY);

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- hit this to delete an item."
});

const defaultItems = [item1, item2, item3];


//SCHEMA AND MODEL TO CUSTOM TODOLISTS
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);




//MAIN PAGE OF TODOLIST
app.get("/", (req, res) => {

  //PRESENT DATE AND TIME
  let day = date.getDate();


  //IF TODOLIST IS EMPTY => FILL IT WITH SAMPLE TASKS
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Inserted");
        }
      });
      res.redirect("/");
    } else {
      //IF IT IS NOT EMPTY, RENDER TASKS
      res.render("list.ejs", {
        listTitle: day,
        newListItems: foundItems
      });
    };
  });
});


//CREATING NEW TODOLISTS BY TYPING INTO URL IT'S NAME ==> "https://link/NAMEOFTODOLIST"
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);


  //SEARCH FOR GIVEN NAME, IF THERE IS NOT SUCH NAME CREATE NEW COLLECTION
  List.findOne({
    name: customListName
  }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        //IF THERE IS SUCH COLLECTION, RENDER IT
        res.render("list.ejs", {
          listTitle: customListName,
          newListItems: foundList.items
        });
      };
    };
  });
});


//CATCHING POST REQUEST TO MAIN PAGE
app.post("/", (req, res) => {

  //SAVING TO VARIABLES ==> ID OF ITEM | NAME OF LIST
  let itemName = req.body.newItem;
  let listName = req.body.list;

  //CREATING MODEL DOCUMENT WITH THE NAME
  const item = new Item({
    name: itemName
  });


  //IF IT IS MAIN PAGE, SAVE IT TO IT'S COLLECTION AND RENDER IT
  if (listName === date.getDate()) {
    item.save();
    res.redirect("/");
  } else {
    //IF IT IS NOT MAIN PAGE, SEARCH FOR THAT COLLECTION, PUSH ITEM INTO IT'S ARRAY, SAVE AND RENDER IT
    List.findOne({
      name: listName
    }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});


//DELETING ITEMS FROM TODOLIST
app.post("/delete", (req, res) => {

  //ID OF CHECKED TASK AND NAME OF THIS LIST
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;


  //DELETING FROM MAIN PAGE IF IT'S SELECTED
  if (listName === date.getDate()) {
    Item.findByIdAndRemove(checkedItemID, (err) => {
      if (!err) {
        res.redirect("/");
      };
    });
  } else {
    //DELETING FROM CUSTOM TODOLIST
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemID
        }
      }
    }, (err, foundList) => {
      if (!err) {
        res.redirect("/" + listName);
      };
    });
  };
});


//PORT ON WHICH WEBSITE IS LISTENING
app.listen(process.env.PORT || 3000, () => {
  console.log("Server has started!");
});
