// components/Navbar.jsx
import React, { useContext } from "react";
import AppBarTop from "./AppBarTop";
import ToolbarMenu from "./ToolbarMenu";
import { UserContext } from "../contexts/UserContext";

export default function Navbar() {
  const { userRole, loading } = useContext(UserContext);

  return (
    <>
      <AppBarTop loading={loading} />
      {!loading && <ToolbarMenu userRole={userRole} />}
    </>
  );
}
