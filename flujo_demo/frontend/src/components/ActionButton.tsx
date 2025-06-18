import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Button, Box, Text, VStack, type ButtonProps, Icon } from '@chakra-ui/react';
import type { IconType } from 'react-icons'; // Import IconType

// Interface matches the one in Dashboard.tsx (no icon prop)
export interface ActionButtonProps extends ButtonProps {
  to?: string; // Make 'to' optional
  onClick?: () => void;
  title: string;
  subtitle?: string;
  icon?: IconType; // Changed from React.ElementType to IconType
  // colorScheme is already part of ButtonProps
  // variant is part of ButtonProps
}

const ActionButton: React.FC<ActionButtonProps> = ({
  to,
  onClick,
  title,
  subtitle,
  icon: IconComponent, // Renamed for clarity if used as component
  colorScheme,
  variant = 'solid',
  size = "lg",
  minHeight = "120px",
  fontSize = "lg",
  ...props
}) => {
  // Determine icon size based on button size
  const getIconSize = (buttonSize: string) => {
    switch (buttonSize) {
      case 'sm': return '1.5em';
      case 'md': return '1.8em';
      case 'lg': return '2em';
      case 'xl': return '2.5em';
      default: return '2em';
    }
  };

  // Determine text size based on button size
  const getTitleFontSize = (buttonSize: string, customFontSize?: string) => {
    if (customFontSize) return customFontSize;
    switch (buttonSize) {
      case 'sm': return 'sm';
      case 'md': return 'md';
      case 'lg': return 'lg';
      case 'xl': return 'xl';
      default: return 'lg';
    }
  };

  const getSubtitleFontSize = (buttonSize: string) => {
    switch (buttonSize) {
      case 'sm': return 'xs';
      case 'md': return 'sm';
      case 'lg': return 'sm';
      case 'xl': return 'md';
      default: return 'sm';
    }
  };

  const buttonContent = (
    <VStack spacing={subtitle ? 1 : 2} justifyContent="center" alignItems="center" w="100%">
      {IconComponent && (
        <Icon 
          as={IconComponent as any} 
          boxSize={getIconSize(size as string)} 
          mb={subtitle ? 0 : 1} 
        />
      )}
      <Text 
        fontSize={getTitleFontSize(size as string, fontSize as string)} 
        fontWeight="bold" 
        whiteSpace="normal" 
        wordBreak="break-word" 
        textAlign="center"
        lineHeight="shorter"
      >
        {title}
      </Text>
      {subtitle && (
        <Text 
          fontSize={getSubtitleFontSize(size as string)} 
          mt={0} 
          opacity={0.8} 
          whiteSpace="normal" 
          wordBreak="break-word" 
          textAlign="center"
          lineHeight="shorter"
        >
          {subtitle}
        </Text>
      )}
    </VStack>
  );

  const commonProps = {
    colorScheme,
    variant,
    size,
    height: "auto", // Adjust height to auto to accommodate varying content
    minHeight,
    p: size === 'sm' ? 2 : 4,
    boxShadow: "md",
    _hover: { boxShadow: 'lg', transform: 'translateY(-2px)' },
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    ...props,
  };

  if (to) {
    return (
      <Button
        as={RouterLink}
        to={to}
        {...commonProps}
      >
        {buttonContent}
      </Button>
    );
  }

  return (
    <Button onClick={onClick} {...commonProps}>
      {buttonContent}
    </Button>
  );
};

export default ActionButton; 