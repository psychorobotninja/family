import { Link } from "react-router-dom";
import styled from 'styled-components';

export const Nav = styled.nav`
    background: linear-gradient(120deg, #012e2f, #0b1956);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    gap: 1rem;
    flex-wrap: wrap;
    z-index: 12;
    box-shadow: 0 10px 30px rgba(2, 6, 23, 0.4);
    min-height: 80px;

    @media (max-width: 768px) {
        padding: 1rem;
    }
`;

export const NavHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 1 0 220px;
    width: 100%;
`;

export const NavBrand = styled(Link)`
    display: flex;
    align-items: center;
    text-decoration: none;
    padding-right: 1rem;
`;

export const NavToggle = styled.button`
    border: 1px solid rgba(248, 250, 252, 0.4);
    background: transparent;
    color: #f8fafc;
    border-radius: 999px;
    padding: 0.35rem 0.85rem;
    font-weight: 600;
    cursor: pointer;
    display: none;

    @media (max-width: 768px) {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
    }
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

    @media (max-width: 768px) {
        width: 100%;
        padding: 0.5rem 0;
    }
`;

export const NavMenu = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;

    @media (max-width: 768px) {
        width: 100%;
        flex-direction: column;
        align-items: flex-start;
        overflow: hidden;
        max-height: ${({ $open }) => ($open ? '400px' : '0')};
        opacity: ${({ $open }) => ($open ? 1 : 0)};
        pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
        transition: max-height 0.3s ease, opacity 0.2s ease;
    }
`;

export const NavActions = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #fff;

    @media (max-width: 768px) {
        width: 100%;
        justify-content: space-between;
        flex-wrap: wrap;
        border-top: 1px solid rgba(148, 163, 184, 0.3);
        padding-top: 0.75rem;
    }
`;

export const UserSelect = styled.select`
    background: #111827;
    color: #fff;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 0.3rem 0.75rem;
    font-size: 0.95rem;
    min-width: 180px;

    @media (max-width: 768px) {
        flex: 1;
        width: 100%;
    }
`;

export const UserLabel = styled.span`
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;

    @media (max-width: 768px) {
        flex-basis: 100%;
    }
`;