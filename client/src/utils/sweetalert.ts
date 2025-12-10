import Swal from 'sweetalert2';

export const showSuccess = (message: string, title = 'Success!') => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    timer: 3000,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
  });
};

export const showError = (message: string, title = 'Error!') => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonColor: '#dc2626',
  });
};

export const showConfirm = (message: string, title = 'Are you sure?') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#059669',
    cancelButtonColor: '#dc2626',
    confirmButtonText: 'Yes, proceed',
    cancelButtonText: 'Cancel',
  });
};

export const showLoading = (message = 'Processing...') => {
  return Swal.fire({
    title: message,
    allowOutsideClick: false,
    showConfirmButton: false,
    willOpen: () => {
      Swal.showLoading();
    },
  });
};

export const closeLoading = () => {
  Swal.close();
};