"use client";

import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDown, Check, Building2, RefreshCw } from 'lucide-react';
import { useLayout } from '@/contexts/LayoutContext';

export function ClientSelector() {
    const { currentTenant, setCurrentTenant, availableTenants, refreshTenants } = useLayout();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshTenants();
        setIsRefreshing(false);
    };

    return (
        <Menu as="div" className="relative inline-block text-left w-full px-4 mb-4">
            <div>
                <Menu.Button className="inline-flex w-full justify-between items-center rounded-md bg-[#1e293b] px-4 py-2 text-sm font-medium text-white hover:bg-[#2c3b52] border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="flex-shrink-0 w-6 h-6 rounded bg-primary-600 flex items-center justify-center text-xs">
                            {currentTenant ? currentTenant.name.charAt(0).toUpperCase() : <Building2 className="w-3 h-3" />}
                        </div>
                        <span className="truncate">{currentTenant?.name || "Sélectionner un client"}</span>
                    </div>
                    <ChevronDown className="-mr-1 ml-2 h-4 w-4" aria-hidden="true" />
                </Menu.Button>
            </div>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute left-4 right-4 z-10 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1 max-h-60 overflow-y-auto">
                        <div className="px-4 py-2 border-b border-gray-100">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                {isRefreshing ? 'Actualisation...' : 'Actualiser'}
                            </button>
                        </div>
                        {availableTenants.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-gray-500">Aucun client trouvé</div>
                        ) : (
                            availableTenants.map((client) => (
                                <Menu.Item key={client.id}>
                                    {({ active }) => (
                                        <button
                                            onClick={() => setCurrentTenant(client)}
                                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                } group flex w-full items-center justify-between px-4 py-2 text-sm`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${active ? 'bg-primary-500' : 'bg-gray-300'}`} />
                                                {client.name}
                                            </span>
                                            {currentTenant?.id === client.id && (
                                                <Check className="h-4 w-4 text-primary-600" />
                                            )}
                                        </button>
                                    )}
                                </Menu.Item>
                            ))
                        )}
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
