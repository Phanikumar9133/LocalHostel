// ToastNotification.jsx
import { Toast } from 'react-bootstrap';

function ToastNotification({ show, message }) {
  return (
    <Toast show={show} className="position-fixed bottom-0 end-0 m-3">
      <Toast.Header>
        <strong>Notification</strong>
      </Toast.Header>
      <Toast.Body>{message}</Toast.Body>
    </Toast>
  );
}

export default ToastNotification;