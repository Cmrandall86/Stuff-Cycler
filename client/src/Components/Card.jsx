import React from 'react'
import PropTypes from 'prop-types'
import "../CSS/Card.css"

const Card = ({element}) => {
  return (
    <div className='card'>
        {element}
    </div>
  )
}

Card.propTypes = {}

export default Card