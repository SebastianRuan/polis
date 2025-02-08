// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.
/** @jsx jsx */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { populateUserStore } from './actions'

import _ from 'lodash'

import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { Flex, Box, jsx } from 'theme-ui'

/* landers */
import Home from './components/landers/home'
import TOS from './components/landers/tos'
import Privacy from './components/landers/privacy'
import PasswordReset from './components/landers/password-reset'
import PasswordResetInit from './components/landers/password-reset-init'
import PasswordResetInitDone from './components/landers/password-reset-init-done'
import SignIn from './components/landers/signin'
import SignOut from './components/landers/signout'
import CreateUser from './components/landers/createuser'

// /conversation-admin
import ConversationAdminContainer from './components/conversation-admin/index'

import Conversations from './components/conversations-and-account/conversations'
import Account from './components/conversations-and-account/account'
import Integrate from './components/conversations-and-account/integrate'

import InteriorHeader from './components/interior-header'

const PrivateRoute = ({ element: Component, isLoading, authed, ...rest }) => {
  const location = useLocation();
  if (isLoading) {
    return null;
  }
  return authed === true ? (
    <Component {...rest} />
  ) : (
    <Navigate to="/signin" state={{ from: location }} replace />
  );
}

PrivateRoute.propTypes = {
  element: PropTypes.element,
  isLoading: PropTypes.bool,
  location: PropTypes.object,
  authed: PropTypes.bool
}

@connect((state) => {
  return state.user
})
class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      sidebarOpen: false
      // sidebarDocked: true,
    }
  }

  loadUserData() {
    this.props.dispatch(populateUserStore())
  }

  componentWillMount() {
    this.loadUserData()
    const mql = window.matchMedia(`(min-width: 800px)`)
    mql.addListener(this.mediaQueryChanged.bind(this))
    this.setState({ mql: mql, docked: mql.matches })
  }

  isAuthed() {
    let authed = false

    if (!_.isUndefined(this.props.isLoggedIn) && this.props.isLoggedIn) {
      authed = true
    }

    if (
      (this.props.error && this.props.status === 401) ||
      this.props.status === 403
    ) {
      authed = false
    }

    return authed
  }

  isLoading() {
    const { isLoggedIn } = this.props

    return _.isUndefined(
      isLoggedIn
    ) /* if isLoggedIn is undefined, the app is loading */
  }

  componentDidMount() {
    this.mediaQueryChanged()
  }

  componentWillUnmount() {
    this.state.mql.removeListener(this.mediaQueryChanged.bind(this))
  }

  mediaQueryChanged() {
    this.setState({ sidebarDocked: this.state.mql.matches })
  }

  onSetSidebarOpen(open) {
    this.setState({ sidebarOpen: open })
  }

  handleMenuButtonClick() {
    this.setState({ sidebarOpen: !this.state.sidebarOpen })
  }

  render() {
    const SignInWrapper = (props) => {
      return <SignIn {...props} authed={this.isAuthed()} />;
    };
    const { location } = this.props
    return (
      <>
        <Routes>
          <Route
            path=":url/*(/+)"
            element={<Navigate to={location.pathname.slice(0, -1)} replace />} />
          <Route path="/home" element={<Home />} />
          <Route
            path="/signin" element={<SignInWrapper />}
            render={() => <SignIn {...this.props} authed={this.isAuthed()} />}
          />
          <Route path="/signout" element={<SignOut />} />
          <Route path="/createuser" element={<CreateUser />} />

          <Route path="/pwreset" element={<PasswordReset />} />
          <Route path="/pwresetinit" element={<PasswordResetInit />} >
            <Route path="done" element={<PasswordResetInitDone />} />
          </Route>
          <Route path="/tos" element={<TOS />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
        <InteriorHeader>
          <Flex>
            <Box sx={{ mr: [5], p: [4], flex: '0 0 auto' }}>
              <Box sx={{ mb: [3] }}>
                <Link sx={{ variant: 'links.nav' }} to={`/`}>
                  Conversations
                </Link>
              </Box>
              <Box sx={{ mb: [3] }}>
                <Link sx={{ variant: 'links.nav' }} to={`/integrate`}>
                  Integrate
                </Link>
              </Box>
              <Box sx={{ mb: [3] }}>
                <Link sx={{ variant: 'links.nav' }} to={`/account`}>
                  Account
                </Link>
              </Box>
            </Box>
            <Box
              sx={{
                p: [4],
                flex: '0 0 auto',
                maxWidth: '35em',
                mx: [4]
              }}>
              <Routes>
                <Route path="/"
                  element={
                    <PrivateRoute
                      isLoading={this.isLoading()}
                      authed={this.isAuthed()}
                      element={Conversations}
                    />} />
                <Route path="conversations"
                  element={
                    <PrivateRoute
                      isLoading={this.isLoading()}
                      authed={this.isAuthed()}
                      element={Conversations}
                    />} />
                <Route path="account"
                  element={
                    <PrivateRoute
                      isLoading={this.isLoading()}
                      authed={this.isAuthed()}
                      element={Account}
                    />
                  } />
                <Route path="integrate"
                  element={
                    <PrivateRoute
                      isLoading={this.isLoading()}
                      authed={this.isAuthed()}
                      element={Integrate}
                    />} />
              </Routes>
            </Box>
          </Flex>
          <Routes>
            <Route path="m/:conversation_id"
              element={
                <PrivateRoute
                  isLoading={this.isLoading()}
                  authed={this.isAuthed()}
                  element={ConversationAdminContainer}
                />} />
          </Routes>
        </InteriorHeader>
      </>
    )
  }
}

App.propTypes = {
  dispatch: PropTypes.func,
  isLoggedIn: PropTypes.bool,
  location: PropTypes.shape({
    pathname: PropTypes.string
  }),
  user: PropTypes.shape({
    uid: PropTypes.string,
    email: PropTypes.string,
    created: PropTypes.number,
    hname: PropTypes.string
  })
}

function AppWithLocation(props) {
  const location = useLocation()
  return <App {...props} location={location} />
}

export default AppWithLocation
