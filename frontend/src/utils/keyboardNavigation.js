// Keyboard Navigation Utilities
// Provides consistent keyboard navigation support across the application

/**
 * Creates a keyboard navigation handler for interactive elements
 * @param {Object} options - Configuration options
 * @param {Function} options.onEnter - Handler for Enter key
 * @param {Function} options.onSpace - Handler for Space key
 * @param {Function} options.onEscape - Handler for Escape key
 * @param {Function} options.onArrowUp - Handler for Arrow Up key
 * @param {Function} options.onArrowDown - Handler for Arrow Down key
 * @param {Function} options.onArrowLeft - Handler for Arrow Left key
 * @param {Function} options.onArrowRight - Handler for Arrow Right key
 * @param {Function} options.onTab - Handler for Tab key
 * @param {Function} options.onShiftTab - Handler for Shift+Tab key
 * @returns {Function} Keyboard event handler
 */
export const createKeyboardHandler = (options = {}) => {
  return (event) => {
    const { key, shiftKey } = event;
    
    switch (key) {
      case 'Enter':
        event.preventDefault();
        if (options.onEnter) {
          options.onEnter(event);
        }
        break;
      case ' ':
        event.preventDefault();
        if (options.onSpace) {
          options.onSpace(event);
        }
        break;
      case 'Escape':
        event.preventDefault();
        if (options.onEscape) {
          options.onEscape(event);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (options.onArrowUp) {
          options.onArrowUp(event);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (options.onArrowDown) {
          options.onArrowDown(event);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (options.onArrowLeft) {
          options.onArrowLeft(event);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (options.onArrowRight) {
          options.onArrowRight(event);
        }
        break;
      case 'Tab':
        if (shiftKey) {
          if (options.onShiftTab) {
            options.onShiftTab(event);
          }
        } else {
          if (options.onTab) {
            options.onTab(event);
          }
        }
        break;
      default:
        // Let other keys pass through
        break;
    }
  };
};

/**
 * Creates a roving tabindex handler for managing focus within a group of elements
 * @param {Array} elements - Array of focusable elements
 * @param {number} initialIndex - Initial focused element index
 * @returns {Object} Handler object with methods for managing focus
 */
export const createRovingTabindex = (elements, initialIndex = 0) => {
  let currentIndex = initialIndex;
  
  const updateTabindex = () => {
    elements.forEach((element, index) => {
      if (element) {
        element.setAttribute('tabindex', index === currentIndex ? '0' : '-1');
      }
    });
  };
  
  const focusNext = () => {
    currentIndex = (currentIndex + 1) % elements.length;
    updateTabindex();
    if (elements[currentIndex]) {
      elements[currentIndex].focus();
    }
  };
  
  const focusPrevious = () => {
    currentIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
    updateTabindex();
    if (elements[currentIndex]) {
      elements[currentIndex].focus();
    }
  };
  
  const focusFirst = () => {
    currentIndex = 0;
    updateTabindex();
    if (elements[currentIndex]) {
      elements[currentIndex].focus();
    }
  };
  
  const focusLast = () => {
    currentIndex = elements.length - 1;
    updateTabindex();
    if (elements[currentIndex]) {
      elements[currentIndex].focus();
    }
  };
  
  const setFocus = (index) => {
    if (index >= 0 && index < elements.length) {
      currentIndex = index;
      updateTabindex();
      if (elements[currentIndex]) {
        elements[currentIndex].focus();
      }
    }
  };
  
  // Initialize
  updateTabindex();
  
  return {
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    setFocus,
    getCurrentIndex: () => currentIndex,
    updateTabindex
  };
};

/**
 * Creates a keyboard navigation handler for list items
 * @param {Array} items - Array of items to navigate
 * @param {Function} onSelect - Callback when an item is selected
 * @param {Function} onFocus - Callback when an item is focused
 * @returns {Object} Handler object with methods for managing list navigation
 */
export const createListNavigation = (items, onSelect, onFocus) => {
  let currentIndex = -1;
  
  const focusItem = (index) => {
    if (index >= 0 && index < items.length) {
      currentIndex = index;
      if (onFocus) {
        onFocus(items[index], index);
      }
    }
  };
  
  const selectItem = (index) => {
    if (index >= 0 && index < items.length) {
      if (onSelect) {
        onSelect(items[index], index);
      }
    }
  };
  
  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        focusItem(nextIndex);
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        focusItem(prevIndex);
        break;
      case 'Home':
        event.preventDefault();
        focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        focusItem(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (currentIndex >= 0) {
          selectItem(currentIndex);
        }
        break;
    }
  };
  
  return {
    handleKeyDown,
    focusItem,
    selectItem,
    getCurrentIndex: () => currentIndex,
    reset: () => {
      currentIndex = -1;
    }
  };
};

/**
 * Creates a keyboard navigation handler for modal dialogs
 * @param {Function} onClose - Callback when modal should close
 * @param {Function} onConfirm - Callback when modal should confirm
 * @param {Function} onCancel - Callback when modal should cancel
 * @returns {Function} Keyboard event handler for modals
 */
export const createModalKeyboardHandler = (onClose, onConfirm, onCancel) => {
  return createKeyboardHandler({
    onEscape: onClose,
    onEnter: onConfirm,
    onSpace: onConfirm
  });
};

/**
 * Creates a keyboard navigation handler for buttons
 * @param {Function} onClick - Button click handler
 * @returns {Function} Keyboard event handler for buttons
 */
export const createButtonKeyboardHandler = (onClick) => {
  return createKeyboardHandler({
    onEnter: onClick,
    onSpace: onClick
  });
};

/**
 * Creates a keyboard navigation handler for links
 * @param {Function} onClick - Link click handler
 * @returns {Function} Keyboard event handler for links
 */
export const createLinkKeyboardHandler = (onClick) => {
  return createKeyboardHandler({
    onEnter: onClick,
    onSpace: onClick
  });
};

/**
 * Creates a keyboard navigation handler for form elements
 * @param {Function} onSubmit - Form submit handler
 * @param {Function} onCancel - Form cancel handler
 * @returns {Function} Keyboard event handler for forms
 */
export const createFormKeyboardHandler = (onSubmit, onCancel) => {
  return createKeyboardHandler({
    onEnter: (event) => {
      if (event.target.tagName !== 'TEXTAREA') {
        event.preventDefault();
        onSubmit(event);
      }
    },
    onEscape: onCancel
  });
};

/**
 * Utility to make an element focusable and add keyboard navigation
 * @param {HTMLElement} element - Element to make focusable
 * @param {Function} keyboardHandler - Keyboard event handler
 * @param {number} tabIndex - Tab index value (default: 0)
 */
export const makeFocusable = (element, keyboardHandler, tabIndex = 0) => {
  if (element) {
    element.setAttribute('tabindex', tabIndex);
    element.addEventListener('keydown', keyboardHandler);
  }
};

/**
 * Utility to remove keyboard navigation from an element
 * @param {HTMLElement} element - Element to remove keyboard navigation from
 * @param {Function} keyboardHandler - Keyboard event handler to remove
 */
export const removeFocusable = (element, keyboardHandler) => {
  if (element) {
    element.removeAttribute('tabindex');
    element.removeEventListener('keydown', keyboardHandler);
  }
};

/**
 * Utility to trap focus within a container (useful for modals)
 * @param {HTMLElement} container - Container element to trap focus within
 * @param {Array} focusableElements - Array of focusable elements within the container
 */
export const trapFocus = (container, focusableElements) => {
  if (!container || !focusableElements.length) return;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (event) => {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

export default {
  createKeyboardHandler,
  createRovingTabindex,
  createListNavigation,
  createModalKeyboardHandler,
  createButtonKeyboardHandler,
  createLinkKeyboardHandler,
  createFormKeyboardHandler,
  makeFocusable,
  removeFocusable,
  trapFocus
};
