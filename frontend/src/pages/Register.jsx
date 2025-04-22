import Form from "../components/Form";

function Register() {
  return <Form route="/api/users/register/" method="register" />; // ✅ fixed route
}

export default Register;
