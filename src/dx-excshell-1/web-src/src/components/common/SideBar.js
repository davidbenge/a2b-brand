/* 
* <license header>
*/

import React from 'react'
import { NavLink } from 'react-router-dom'

function SideBar () {
    return (
        <ul className="SideNav">
            <li className="SideNav-item">
                <NavLink
                    className={({ isActive }) => `SideNav-itemLink ${isActive ? 'is-selected' : ''}`}
                    aria-current="page"
                    end
                    to="/"
                >
                    Home
                </NavLink>
            </li>
            <li className="SideNav-item">
                <NavLink
                    className={({ isActive }) => `SideNav-itemLink ${isActive ? 'is-selected' : ''}`}
                    aria-current="page"
                    to="/agency_registration"
                >
                    Agency Registration
                </NavLink>
            </li>
            <li className="SideNav-item">
                <NavLink
                    className={({ isActive }) => `SideNav-itemLink ${isActive ? 'is-selected' : ''}`}
                    aria-current="page"
                    to="/registrations"
                >
                    View Registrations
                </NavLink>
            </li>
        </ul>
    )
}

export default SideBar
