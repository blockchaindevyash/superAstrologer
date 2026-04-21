let confirmationResult = null;

export const setConfirmation = (confirm) => {
  confirmationResult = confirm;
};

export const getConfirmation = () => {
  return confirmationResult;
};