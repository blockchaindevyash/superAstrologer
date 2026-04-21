import React from 'react'
import { TouchableOpacity } from 'react-native'

const RoundButton = ({ onPress, children, size = 56, color = '#ff5722', style, ...props }) => {
  const base = { width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }
  return (
    <TouchableOpacity onPress={onPress} style={[base, style]} activeOpacity={0.85} {...props}>
      {children}
    </TouchableOpacity>
  )
}

export default RoundButton
