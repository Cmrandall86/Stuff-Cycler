import React from 'react'
import PropTypes from 'prop-types'
import { Button  } from '@mui/material'

const ButtonComponent = ({color, text, onClicker , startIcon, disabled, className}) => {
    
    
    return (

        <Button style={{backgroundColor: color}} onClick={onClicker} variant="contained" disabled={disabled} startIcon={startIcon} className={className}>{text}</Button>


    )
}

Button.propTypes = {
    text: PropTypes.string,
    color: PropTypes.string,
    onClicker: PropTypes.func,
}

export default ButtonComponent
