import React from "react";
import PropTypes from "prop-types";
import { Link, Outlet } from "react-router-dom";
import ButtonComponent from "./Button";
import HomePage from "./HomePage";

const RoutesLayout = (props) => {
  return (
    <div>
      <nav className="navBar">
        <ul>
          <li>
            <Link to="/home" className="NavLink">
              <ButtonComponent text={"Home"} />
            </Link>
          </li>

          <Link to="/GroupForm" className="NavLink">
            <ButtonComponent text={"Create a Group"} />
          </Link>

          <li>
            <Link to="/GroupsList" className="NavLink">
              <ButtonComponent text={"List of Groups"} />
            </Link>
          </li>

          <li>
            <Link to="/PostForm" className="NavLink">
              <ButtonComponent text={"Share Stuff"} />
            </Link>
          </li>
          <li>
            <Link to="/PostsList" className="NavLink">
              <ButtonComponent text={"Posts List"} />
            </Link>
          </li>
        </ul>

      </nav>

      <hr />

      <Outlet />
      <div>

      </div>

    </div>
  );
};

RoutesLayout.propTypes = {};

export default RoutesLayout;
