import React from 'react'
import PropTypes from 'prop-types'
import { Button  } from '@mui/material'

const ButtonComponent = ({color, text, onClicker , startIcon, disabled}) => {
    
    
    return (

        <Button style={{backgroundColor: color}} onClick={onClicker} variant="contained" disabled={disabled} startIcon={startIcon}>{text}</Button>


    )
}

Button.propTypes = {
    text: PropTypes.string,
    color: PropTypes.string,
    onClicker: PropTypes.func,
}

export default ButtonComponent
