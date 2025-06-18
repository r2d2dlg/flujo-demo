import React from 'react';
import { Box, VStack, Text, Icon, Collapse, useDisclosure } from '@chakra-ui/react';
import { FaUserTie } from 'react-icons/fa';
import { FiDollarSign, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface SubItem {
  label?: string;
  name?: string;
  path: string;
}

interface SidebarItem {
  label?: string;
  name?: string;
  icon: React.ElementType;
  path?: string;
  subItems?: SubItem[];
  children?: SubItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    label: 'Consultores',
    icon: FaUserTie,
    subItems: [
      {
        label: 'Tablas',
        path: '/contabilidad/consultores/tables'
      },
      {
        label: 'Vista',
        path: '/contabilidad/consultores/view'
      }
    ]
  },
  {
    name: 'Costo Directo',
    icon: FiDollarSign,
    children: [
      {
        name: 'Tabla',
        path: '/costo-directo/table'
      },
      {
        name: 'Vista',
        path: '/costo-directo/view'
      }
    ]
  }
];

const SidebarItemComponent: React.FC<{ item: SidebarItem }> = ({ item }) => {
  const { isOpen, onToggle } = useDisclosure();
  const navigate = useNavigate();
  
  const hasSubItems = (item.subItems && item.subItems.length > 0) || (item.children && item.children.length > 0);
  const subItems = item.subItems || item.children || [];
  const itemName = item.label || item.name || '';

  const handleClick = () => {
    if (hasSubItems) {
      onToggle();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        p={3}
        cursor="pointer"
        _hover={{ bg: 'gray.100' }}
        onClick={handleClick}
      >
        <Icon as={item.icon} mr={3} />
        <Text flex={1}>{itemName}</Text>
        {hasSubItems && (
          <Icon as={isOpen ? FiChevronDown : FiChevronRight} />
        )}
      </Box>
      
      {hasSubItems && (
        <Collapse in={isOpen}>
          <VStack align="stretch" pl={6} spacing={0}>
            {subItems.map((subItem, index) => (
              <Box
                key={index}
                p={2}
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                onClick={() => navigate(subItem.path)}
              >
                <Text fontSize="sm">{subItem.label || subItem.name}</Text>
              </Box>
            ))}
          </VStack>
        </Collapse>
      )}
    </Box>
  );
};

const Sidebar: React.FC = () => {
  return (
    <Box w="250px" bg="white" borderRight="1px" borderColor="gray.200" h="full">
      <VStack align="stretch" spacing={0}>
        {sidebarItems.map((item, index) => (
          <SidebarItemComponent key={index} item={item} />
        ))}
      </VStack>
    </Box>
  );
};

export default Sidebar; 