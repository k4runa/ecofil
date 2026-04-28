import React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { User as UserIcon, Settings, Menu, Search } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';
import { QuickSearch } from './quick-search';

export function Header({
	user,
	onOpenSidebar,
	onOpenSettings,
	onOpenSearch
}: {
	user: any,
	onOpenSidebar: () => void,
	onOpenSettings: () => void,
	onOpenSearch: () => void
}) {
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(10);

	return (
		<header
			className={cn(
				'sticky top-0 z-50 mx-auto w-full max-w-5xl border-b border-transparent md:rounded-md md:border md:transition-all md:ease-out',
				{
					'bg-background/95 supports-[backdrop-filter]:bg-background/50 border-border backdrop-blur-lg md:top-6 md:max-w-4xl md:shadow':
						scrolled && !open,
					'bg-background/90': open,
				},
			)}
		>
			<nav
				className={cn(
					'flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out',
					{
						'md:px-2': scrolled,
					},
				)}
			>
				<div className="flex items-center gap-2">
					<button
						onClick={onOpenSidebar}
						className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-zinc-800 rounded-xl transition-colors"
					>
						<Menu className="w-5 h-5" />
					</button>
					<h1 className="text-lg font-black tracking-tighter text-foreground md:hidden">ecofil</h1>
					<h1 className="text-xl font-black tracking-tighter text-foreground hidden md:block">ecofil</h1>
				</div>

				<div className="hidden md:flex flex-1 justify-center max-w-md mx-4">
					<QuickSearch />
				</div>

				<div className="flex items-center gap-3">
					<button
						onClick={onOpenSettings}
						className="p-2 text-muted-foreground hover:text-foreground hover:bg-zinc-800 rounded-xl transition-all"
					>
						<Settings className="w-4 h-4" />
					</button>

					<Button size="icon" variant="ghost" onClick={() => setOpen(!open)} className="md:hidden">
						<MenuToggleIcon open={open} className="size-5" duration={300} />
					</Button>
				</div>
			</nav>

			<div
				className={cn(
					'bg-background/95 backdrop-blur-xl fixed top-14 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-y md:hidden',
					open ? 'block' : 'hidden',
				)}
			>
				<div
					data-slot={open ? 'open' : 'closed'}
					className={cn(
						'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out',
						'flex h-full w-full flex-col p-6 space-y-8',
					)}
				>
					<div className="space-y-4">
						<label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Quick Discovery</label>
						<button
							onClick={() => { onOpenSearch(); setOpen(false); }}
							className="w-full flex items-center gap-3 px-4 py-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all text-sm font-bold"
						>
							<Search className="w-5 h-5" />
							<span>Explore the library</span>
						</button>
					</div>

					<div className="pt-4 border-t border-border/50">
						<div className="flex items-center gap-4 mb-6">
							<div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
								<UserIcon className="w-6 h-6 text-primary" />
							</div>
							<div>
								<p className="font-black text-lg text-foreground">{user?.username}</p>
								<p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Enthusiast Member</p>
							</div>
						</div>
						<Button variant="outline" className="w-full rounded-xl h-12 font-black text-xs uppercase tracking-widest" onClick={() => { onOpenSettings(); setOpen(false); }}>
							Settings
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}
