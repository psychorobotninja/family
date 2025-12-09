import React from "react";
import { Nav, NavLink, NavMenu, NavActions, UserSelect, UserLabel, NavBrand, BrandTitle } from "./NavbarElements";
import { participants } from "../../data/participants";

const Navbar = ({ selectedUserId, onSelectUser }) => {
    const handleSelect = (event) => {
        if (typeof onSelectUser === 'function') {
            onSelectUser(event.target.value);
        }
    };

    return (
        <Nav>
            <NavMenu>
                <NavBrand to="/">
                    <BrandTitle>Baca Family App</BrandTitle>
                </NavBrand>
                <NavLink to="/NameDraw" activeStyle>
                    Name Draw
                </NavLink>
                <NavLink to="/Family" activeStyle>
                    Family
                </NavLink>
                <NavLink to="/Calendar" activeStyle>
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