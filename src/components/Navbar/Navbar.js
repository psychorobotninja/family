import React from "react";
import { Nav, NavLink, NavMenu } from "./NavbarElements";

const Navbar = () => {
    return (
        <>
            <Nav>
                <NavMenu>
                <NavLink to="/">
                    <h1 style={{ color: 'white' }}>MyLogo</h1>
                </NavLink>
                <NavLink to="/about" activeStyle>
                    About
                </NavLink>
                <NavLink to="/Thomas" activeStyle>
                    Thomas
                </NavLink>
                </NavMenu>
            </Nav>
        </>
    );
}
export default Navbar;