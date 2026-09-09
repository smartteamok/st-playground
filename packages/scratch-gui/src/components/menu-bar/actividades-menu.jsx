import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {connect} from 'react-redux';

import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuItem} from '../menu/menu.jsx';
import useMenuNavigation from '../../hooks/use-menu-navigation';

import styles from './menu-bar.css';
import dropdownCaret from './dropdown-caret.svg';
import actividadesIcon from './icon--actividades.svg';

/**
 * Classroom activities menu. New file (D-05); shown only when the host
 * passes `onClickActividad` as a list of {title, onClick}.
 */
const ActividadesMenu = ({
    onClick,
    isRtl,
    depth
}) => {
    const {
        menuRef,
        isExpanded,
        handleOnOpen,
        handleOnClose,
        handleKeyDown,
        handleKeyDownOpenMenu
    } = useMenuNavigation({
        depth,
        isRtl
    });

    const wrapCallback = useCallback(
        callback => () => {
            callback();
            handleOnClose();
        },
        [handleOnClose]
    );

    if (!onClick || !onClick.length) {
        return null;
    }

    return (
        <button
            className={classNames(styles.menuBarItem, styles.hoverable, {
                [styles.active]: isExpanded()
            })}
            onClick={handleOnOpen}
            onKeyDown={handleKeyDown}
            aria-label="Actividades"
            aria-expanded={isExpanded()}
            ref={menuRef}
        >
            <img
                src={actividadesIcon}
                alt=""
            />
            <span className={styles.collapsibleLabel}>
                {'Actividades'}
            </span>
            <img src={dropdownCaret} />
            <MenuBarMenu
                className={classNames(styles.menuBarMenu)}
                open={isExpanded()}
                place={isRtl ? 'left' : 'right'}
                onRequestClose={handleOnClose}
            >
                {onClick.map(itemProps => (
                    <MenuItem
                        key={itemProps.title}
                        onClick={wrapCallback(itemProps.onClick)}
                        onParentKeyDown={handleKeyDownOpenMenu}
                        isDataMenuItem
                    >
                        {itemProps.title}
                    </MenuItem>
                ))}
            </MenuBarMenu>
        </button>
    );
};

ActividadesMenu.propTypes = {
    depth: PropTypes.number,
    isRtl: PropTypes.bool,
    onClick: PropTypes.arrayOf(
        PropTypes.shape({
            onClick: PropTypes.func,
            title: PropTypes.string
        })
    )
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

export default connect(mapStateToProps)(ActividadesMenu);
