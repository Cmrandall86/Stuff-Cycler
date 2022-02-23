import React from "react";
import PropTypes from "prop-types";
import { Link, Outlet } from "react-router-dom";
import ButtonComponent from "./Button";
import "../CSS/HomePage.css";
import Card from "./Card";

const HomePage = (props) => {
  return (

    <div className="HomePage">

      <h2>Thanks for checking out Stuff-Cycler</h2>
      <p>
        The idea here is that we can make a group of people, give them a level
        of priority, and share items we are looking to get rid of. We all
        upgrade items when our previous things still have plenty of life in
        them. With Stuff-Cycler we can take a quick photo of these things and
        share them with others without having to spend time finding our old but
        still useful items a new home.
      </p>
      <br />
      <br />
      <p>
        Click{" "}
        <Link to="/GroupForm" className="home_page_button">
          <ButtonComponent text={"here"} color={"green"} />
        </Link>{" "}
        to get started!{" "}
      </p>
    </div>
  );
};

HomePage.propTypes = {};

export default HomePage;
