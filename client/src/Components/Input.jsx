import React from "react";
import PropTypes from "prop-types";
import { TextField } from "@mui/material";

const Input = ({ Placeholder, Name, Type, Value, Label, onChange, ID, rows, className }) => {
  return (
    <div >
      <TextField 
      className = {className}
      id={ID} 
      label={Label} 
      variant="outlined"
      placeholder={Placeholder}
      htmlFor={Name}
      value={Value}
      onChange={onChange}
      type={Type}
      name={Name}
      multiline
      rows={rows}
       />

    </div>
  );
};

Input.propTypes = {};

export default Input;
