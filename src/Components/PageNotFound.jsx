import React from 'react';
import PropTypes from 'prop-types';
import { Link } from "react-router-dom";



const PageNotFound = (props) => {

        return (
          <div>
            <h2>Error: this page doesnt exist</h2>
            <p>
              <Link to="/">Go to the home page</Link>
            </p>
          </div>
        );
      
      
};

PageNotFound.propTypes = {};

export default PageNotFound;
