import { Link } from "react-router-dom";
import styled from 'styled-components';

export const Nav = styled.nav`
    background: linear-gradient(120deg, #012e2f, #0b1956);
    height: 80px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    z-index: 12;
    box-shadow: 0 10px 30px rgba(2, 6, 23, 0.4);
`;

export const NavBrand = styled(Link)`
    display: flex;
    align-items: center;
    text-decoration: none;
    padding-right: 1rem;
`;

export const BrandTitle = styled.h1`
    font-family: var(--family-display);
    letter-spacing: 0.08em;
    font-size: 1.5rem;
    color: #f8fafc;
    margin: 0;
    text-transform: uppercase;
`;

export const NavLink = styled(Link)`
    color: #fff;
    display: flex;
    align-items: center;
    text-decoration: none;
    padding: 0 1rem;
    height: 100%;
    cursor: pointer;
    &.active {
        color: #15cdfc;
    }
`;

export const NavMenu = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
`;

export const NavActions = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #fff;
`;

export const UserSelect = styled.select`
    background: #111827;
    color: #fff;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 0.3rem 0.75rem;
    font-size: 0.95rem;
`;

export const UserLabel = styled.span`
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
`;