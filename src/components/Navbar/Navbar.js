import React, { useState } from "react";
import {
    Nav,
    NavLink,
    NavMenu,
    NavActions,
    UserSelect,
    UserLabel,
    NavBrand,
    BrandTitle,
    NavHeader,
    NavToggle
} from "./NavbarElements";
import { participants } from "../../data/participants";

const Navbar = ({ selectedUserId, onSelectUser }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const handleSelect = (event) => {
        if (typeof onSelectUser === 'function') {
            onSelectUser(event.target.value);
        }
    };

    const toggleMenu = () => {
        setMenuOpen((prev) => !prev);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    return (
        <Nav>
            <NavHeader>
                <NavBrand to="/">
                    <BrandTitle>Baca Family App</BrandTitle>
                </NavBrand>
                <NavToggle
                    type="button"
                    onClick={toggleMenu}
                    aria-label="Toggle navigation"
                    aria-expanded={menuOpen}
                    aria-controls="family-nav-menu"
                >
                    {menuOpen ? 'Close' : 'Menu'}
                </NavToggle>
            </NavHeader>
            <NavMenu id="family-nav-menu" $open={menuOpen}>
                <NavLink to="/NameDraw" activeStyle onClick={closeMenu}>
                    Name Draw
                </NavLink>
                <NavLink to="/Family" activeStyle onClick={closeMenu}>
                    Family
                </NavLink>
                <NavLink to="/Calendar" activeStyle onClick={closeMenu}>
                    Calendar
                </NavLink>
            </NavMenu>
            <NavActions>
                <UserLabel>Who are you?</UserLabel>
                <UserSelect value={selectedUserId || ''} onChange={handleSelect}>
                    <option value="">Select name</option>
                    {participants.map((person) => (
                        <option key={person.id} value={person.id}>
                            {person.name}
                        </option>
                    ))}
                </UserSelect>
            </NavActions>
        </Nav>
    );
};

Navbar.defaultProps = {
    selectedUserId: '',
    onSelectUser: () => {}
};

export default Navbar;