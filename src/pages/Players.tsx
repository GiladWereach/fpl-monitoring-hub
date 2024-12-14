import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Players = () => {
  const [search, setSearch] = useState("");
  
  const { data: players, isLoading } = useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      console.log("Fetching players data");
      const { data, error } = await supabase
        .from("players")
        .select(`
          *,
          teams (
            name,
            short_name
          )
        `)
        .order('total_points', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredPlayers = players?.filter(player => 
    player.web_name.toLowerCase().includes(search.toLowerCase()) ||
    player.first_name.toLowerCase().includes(search.toLowerCase()) ||
    player.second_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Player Statistics</h1>
      
      <div className="mb-6">
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers?.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.web_name}</TableCell>
                  <TableCell>{player.teams?.short_name}</TableCell>
                  <TableCell>
                    {player.element_type === 1 ? "GK" :
                     player.element_type === 2 ? "DEF" :
                     player.element_type === 3 ? "MID" : "FWD"}
                  </TableCell>
                  <TableCell className="text-right">{player.total_points}</TableCell>
                  <TableCell className="text-right">£{(player.now_cost / 10).toFixed(1)}m</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Players;